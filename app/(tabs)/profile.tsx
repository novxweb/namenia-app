import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    async function getProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            let { data, error, status } = await supabase
                .from('profiles')
                .select(`full_name, avatar_url`)
                .eq('id', user.id)
                .single();

            // If profile doesn't exist yet, we might get an error, or just null data if we handle it.
            // For now, let's just use metadata if profile fetch fails or is empty.
            if (error && status !== 406) {
                console.log("Error loading profile", error);
                // Fallback to user metadata
                setFullName(user.user_metadata?.full_name || '');
            } else if (data) {
                setFullName(data.full_name);
                setAvatarUrl(data.avatar_url);
            } else {
                setFullName(user.user_metadata?.full_name || '');
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert("Error", error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile({
        full_name,
        avatar_url,
    }: {
        full_name: string;
        avatar_url: string;
    }) {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const updates = {
                id: user.id,
                full_name,
                avatar_url,
                updated_at: new Date(),
            };

            let { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                throw error;
            } else {
                Alert.alert("Success", "Profile updated!");
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert("Error", error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerClassName="p-6">
                <View className="max-w-md mx-auto w-full gap-8">
                    <View className="items-center gap-4">
                        <View className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center overflow-hidden border-2 border-slate-300 dark:border-slate-700">
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} className="h-full w-full" />
                            ) : (
                                <Text className="text-3xl font-bold text-slate-400">
                                    {(fullName || user?.email || '?').charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                {fullName || 'User'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400">
                                {user?.email}
                            </Text>
                        </View>
                    </View>

                    <View className="gap-4">
                        <View className="gap-2">
                            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Text>
                            <TextInput
                                value={user?.email}
                                editable={false}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-500 dark:text-slate-400"
                            />
                        </View>

                        <View className="gap-2">
                            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</Text>
                            <TextInput
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Your Name"
                                placeholderTextColor="#94a3b8"
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                            />
                        </View>

                        {!user ? (
                            <Pressable
                                onPress={() => router.push('/login')}
                                className="bg-blue-600 active:bg-blue-700 p-4 rounded-lg items-center mt-2"
                            >
                                <Text className="text-white font-bold text-base">
                                    Sign In
                                </Text>
                            </Pressable>
                        ) : (
                            <>
                                <Pressable
                                    onPress={() => updateProfile({ full_name: fullName, avatar_url: avatarUrl })}
                                    disabled={loading}
                                    className="bg-blue-600 active:bg-blue-700 p-4 rounded-lg items-center mt-2"
                                >
                                    <Text className="text-white font-bold text-base">
                                        {loading ? "Saving..." : "Update Profile"}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => signOut()}
                                    className="bg-slate-200 dark:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 p-4 rounded-lg items-center mt-2"
                                >
                                    <Text className="text-slate-900 dark:text-white font-bold text-base">
                                        Sign Out
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
