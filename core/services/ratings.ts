import { supabase } from '@/lib/supabase';

// Represents a user rating from the name_ratings table
export interface NameRating {
    id: string;
    user_id: string;
    name: string;
    rating: number; // 1-10
    created_at: string;
}

/**
 * Saves or updates a user's rating for a specific name
 * @param userId The ID of the authenticated user
 * @param name The generated generic brand name
 * @param rating The numeric rating (1-10)
 */
export async function saveNameRating(userId: string, name: string, rating: number): Promise<void> {
    try {
        if (rating < 1 || rating > 10) {
            throw new Error('Rating must be between 1 and 10');
        }

        const { error } = await supabase
            .from('name_ratings')
            .upsert(
                {
                    user_id: userId,
                    name: name,
                    rating: rating
                },
                { onConflict: 'user_id,name' } // Requires unique constraint on (user_id, name)
            );

        if (error) {
            console.error('Failed to save name rating to DB:', error.message, error.details, error.hint);
            throw error;
        }
    } catch (e: any) {
        console.error('Name rating DB save error:', e.message || e);
        throw e;
    }
}

/**
 * Fetches all ratings for a user to pre-populate their viewed names.
 * @param userId The ID of the authenticated user
 */
export async function fetchUserRatings(userId: string): Promise<Record<string, number>> {
    try {
        const { data, error } = await supabase
            .from('name_ratings')
            .select('name, rating')
            .eq('user_id', userId);

        if (error) {
            console.warn('Failed to fetch ratings from DB:', error.message);
            return {};
        }

        // Convert the array of {name, rating} into a fast lookup map: { [name]: rating }
        const ratingsMap: Record<string, number> = {};
        if (data && data.length > 0) {
            data.forEach((row) => {
                ratingsMap[row.name] = row.rating;
            });
        }
        return ratingsMap;
    } catch (e: any) {
        console.warn('Ratings fetch error:', e.message || e);
        return {};
    }
}
