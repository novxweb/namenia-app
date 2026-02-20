import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Supabase Edge Function URL for server-side availability checks
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl
    || process.env.EXPO_PUBLIC_SUPABASE_URL
    || 'https://prtaykimbobfhjofrist.supabase.co';

export interface DomainResult {
    tld: string;
    available: boolean;
    price?: string;
}

export interface AvailabilityResult {
    domains: DomainResult[];
    socials?: Record<string, boolean>; // Keeping optional for compatibility, but deprecated
    trademark?: {
        available: boolean;
        status: 'safe' | 'risk' | 'registered';
    };
}

export async function checkAvailability(
    name: string,
    tldsToCheck: string[] = ['com', 'io', 'co', 'ai', 'net', 'app'],
    _socialsToCheck: string[] = [] // Deprecated
): Promise<AvailabilityResult> {

    // Normalize TLDs
    const normalizedTlds = tldsToCheck.map(tld => tld.replace(/^\./, ''));

    try {
        console.log(`=== CHECKING AVAILABILITY FOR: ${name} ===`);
        console.log(`TLDs:`, normalizedTlds);

        const { data, error } = await supabase.functions.invoke('check-availability', {
            body: {
                name: name.replace(/[^a-zA-Z0-9-]/g, ''), // Allow hyphens
                tlds: normalizedTlds,
            },
        });

        if (error) {
            console.error('Supabase Function Error:', error);
            throw error;
        }

        console.log('Availability Result:', data);

        return {
            domains: (data.domains || []).map((d: any) => ({
                tld: d.tld,
                available: d.available,
                price: undefined,
            })),
        };

    } catch (e) {
        console.error('Availability check failed:', e);
        // Fail safe: return empty results (false/unavailable) rather than false positives
        return {
            domains: [],
        };
    }
}
