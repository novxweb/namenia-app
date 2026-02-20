import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SupabaseStorage = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        }
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } else {
            AsyncStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } else {
            AsyncStorage.removeItem(key);
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SupabaseStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});
