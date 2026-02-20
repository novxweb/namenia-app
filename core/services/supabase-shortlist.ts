import { supabase } from '@/lib/supabase';
import { GeneratedName } from '@/core/services/generator';

const TABLE_NAME = 'shortlists';

/**
 * Fetch the user's shortlist from Supabase
 */
export async function fetchShortlistFromDB(userId: string): Promise<GeneratedName[]> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('name_data')
            .eq('user_id', userId)
            .single();

        if (error) {
            // PGRST116 = no rows found, that's fine for new users
            if (error.code === 'PGRST116') return [];
            console.warn('Failed to fetch shortlist from DB:', error.message);
            return [];
        }

        return data?.name_data || [];
    } catch (e) {
        console.warn('Shortlist DB fetch error:', e);
        return [];
    }
}

/**
 * Save/replace the entire shortlist for a user in Supabase
 */
export async function saveShortlistToDB(userId: string, items: GeneratedName[]): Promise<void> {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(
                {
                    user_id: userId,
                    name_data: items,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );

        if (error) {
            console.warn('Failed to save shortlist to DB:', error.message);
        }
    } catch (e) {
        console.warn('Shortlist DB save error:', e);
    }
}
