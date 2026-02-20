import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextValue';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Web-specific: Check URL immediately for recovery flow
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const hash = window.location.hash;
            const search = window.location.search;
            if (
                (hash && hash.includes('type=recovery')) ||
                (search && search.includes('type=recovery'))
            ) {
                setTimeout(() => router.replace('/update-password'), 500);
            }
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setLoading(false);

            if (event === 'PASSWORD_RECOVERY') {
                router.replace('/update-password');
            }

            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                const url = await Linking.getInitialURL();
                if (url) {
                    if (url.includes('type=recovery')) {
                        router.replace('/update-password');
                    } else if (event === 'SIGNED_IN' && (url.includes('type=signup') || url.includes('type=invite') || url.includes('type=magiclink'))) {
                        Alert.alert('Success', 'Your email has been verified and you are now logged in.');
                    }
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateProfile = async (updates: { full_name?: string }) => {
        const { error } = await supabase.auth.updateUser({
            data: updates
        });
        if (error) throw error;
    };

    const value = {
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
