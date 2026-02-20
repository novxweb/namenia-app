import { supabase } from '@/lib/supabase';
import { GeneratedName } from '@/core/services/generator';

// ─── Generation Logs ───────────────────────────────────────────

interface LogEntry {
    user_id?: string;
    keyword: string;
    settings: {
        style: string;
        randomness: string;
        industry?: string;
        country?: string;
        vibe?: string;
        tlds: string[];
        socials?: string[];
        languages: string[];
    };
    result_count: number;
    source: 'ai' | 'local' | 'cache' | 'mixed';
}

export async function logGeneration(entry: LogEntry): Promise<void> {
    try {
        const { error } = await supabase
            .from('generation_logs')
            .insert({
                user_id: entry.user_id || null,
                keyword: entry.keyword.toLowerCase().trim(),
                settings: entry.settings,
                result_count: entry.result_count,
                source: entry.source,
            });

        if (error) console.warn('Log insert failed:', error.message);
    } catch (e) {
        // Logging should never break the app
        console.warn('Generation log error:', e);
    }
}

// ─── Name Cache ────────────────────────────────────────────────

interface CacheEntry {
    name: string;
    keyword: string;
    industry?: string;
    style: string;
    score: number;
    availability?: any;
    source: 'ai' | 'local';
}

/**
 * Look up cached names for a keyword + optional industry.
 * Returns high-scoring names sorted by score desc.
 */
export async function getCachedNames(
    keyword: string,
    industry?: string,
    limit: number = 20,
): Promise<GeneratedName[]> {
    // TEMPORARY: Disable cache read to force fresh generation
    // This is necessary because the cache contains invalid "Available" statuses
    // from before the Domainr logic fix.
    return [];

    /*
    try {
        // Normalize keyword for lookup
        const normalizedKeyword = keyword.toLowerCase().trim();

        // Split multi-word keywords and search for any matching word
        const words = normalizedKeyword.split(/\s+/).filter(w => w.length >= 3);
        if (words.length === 0) return [];

        let query = supabase
            .from('name_cache')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        // Search by the main keyword or individual words
        if (words.length === 1) {
            query = query.eq('keyword', normalizedKeyword);
        } else {
            // For multi-word queries, look for any word match
            query = query.in('keyword', [normalizedKeyword, ...words]);
        }

        if (industry && industry !== 'Any') {
            query = query.eq('industry', industry);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data.map((row: any) => ({
            name: row.name,
            tld: '.com',
            style: row.style || 'auto',
            score: row.score || 85,
            availability: row.availability || undefined,
            rationale: row.source === 'ai' ? 'From cache (AI-generated)' : 'From cache',
        }));
    } catch (e) {
        console.warn('Cache lookup error:', e);
        return [];
    }
    */
}

/**
 * Save generated names to the cache.
 * Upserts by name (unique), incrementing times_shown if already exists.
 */
export async function cacheGeneratedNames(
    names: GeneratedName[],
    keyword: string,
    industry?: string,
    source: 'ai' | 'local' = 'ai',
): Promise<void> {
    try {
        const normalizedKeyword = keyword.toLowerCase().trim();

        const rows = names.map(n => ({
            name: n.name,
            keyword: normalizedKeyword,
            industry: (industry && industry !== 'Any') ? industry : null,
            style: n.style || 'auto',
            score: Math.round(n.score || 85),
            availability: n.availability ? JSON.parse(JSON.stringify(n.availability)) : {}, // Deep copy & ensure object
            source,
        }));

        // Insert new names, skip any that already exist (avoid 400 on conflict)
        const { error } = await supabase
            .from('name_cache')
            .upsert(rows, {
                onConflict: 'name',
                ignoreDuplicates: true,
            });

        if (error) console.warn('Cache save failed:', error.message);
    } catch (e) {
        console.warn('Cache save error:', e);
    }
}

/**
 * Increment times_shortlisted for a name — quality signal.
 */
export async function markNameShortlisted(name: string): Promise<void> {
    try {
        // Use RPC or raw SQL for atomic increment
        const { error } = await supabase.rpc('increment_shortlist_count', {
            target_name: name,
        });

        if (error) {
            // Fallback: fetch + update
            const { data } = await supabase
                .from('name_cache')
                .select('times_shortlisted')
                .eq('name', name)
                .single();

            if (data) {
                await supabase
                    .from('name_cache')
                    .update({ times_shortlisted: (data.times_shortlisted || 0) + 1 })
                    .eq('name', name);
            }
        }
    } catch (e) {
        console.warn('Shortlist count error:', e);
    }
}

/**
 * Increment times_shown for names being displayed.
 */
export async function markNamesShown(names: string[]): Promise<void> {
    if (names.length === 0) return;
    try {
        const { error } = await supabase.rpc('increment_shown_count', {
            target_names: names,
        });

        // Silently fail — this is analytics, not critical
        if (error) console.warn('Shown count update failed:', error.message);
    } catch (e) {
        console.warn('Shown count error:', e);
    }
}
