import { supabase } from '@/lib/supabase';
import { GeneratedName } from '@/core/services/generator';
import { Folder } from '@/core/utils/folder-manager';

const TABLE_NAME = 'shortlists';

interface ShortlistDBData {
    names: GeneratedName[];
    folders: Folder[];
}

/**
 * Fetch the user's shortlist and folders from Supabase
 */
export async function fetchShortlistFromDB(userId: string): Promise<ShortlistDBData> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('name_data, folder_data')
            .eq('user_id', userId)
            .single();

        if (error) {
            // PGRST116 = no rows found, that's fine for new users
            if (error.code === 'PGRST116') return { names: [], folders: [] };
            console.warn('Failed to fetch shortlist from DB:', error.message);
            return { names: [], folders: [] };
        }

        return {
            names: data?.name_data || [],
            folders: data?.folder_data || []
        };
    } catch (e) {
        console.warn('Shortlist DB fetch error:', e);
        return { names: [], folders: [] };
    }
}

/**
 * Save/replace the entire shortlist and folders for a user in Supabase
 */
export async function saveShortlistToDB(userId: string, items: GeneratedName[], folders: Folder[]): Promise<void> {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(
                {
                    user_id: userId,
                    name_data: items,
                    folder_data: folders,
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
