import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Feedback states for different sections
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [securityError, setSecurityError] = useState('');
    const [securitySuccess, setSecuritySuccess] = useState('');

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
            console.error("Error loading profile", error);
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
            setProfileError('');
            setProfileSuccess('');

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
                setProfileSuccess("Profile updated successfully!");
                // Clear success message after 3 seconds
                setTimeout(() => setProfileSuccess(''), 3000);
            }
        } catch (error: any) {
            setProfileError(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerClassName="p-6">
                <View className="max-w-md mx-auto w-full gap-8">

                    {/* Header Section */}
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
                        <View className="items-center mb-4">
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                {fullName || 'User Profile'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400">
                                {user?.email}
                            </Text>
                        </View>
                    </View>

                    {/* Authentication Wall */}
                    {!user ? (
                        <View className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                            <Text className="text-center text-slate-600 dark:text-slate-300">
                                You need to be logged in to view your profile settings.
                            </Text>
                            <Pressable
                                onPress={() => router.push('/login')}
                                className="bg-blue-600 active:bg-blue-700 p-4 rounded-lg items-center"
                            >
                                <Text className="text-white font-bold text-base">
                                    Sign In / Register
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View className="gap-8">

                            {/* Personal Info Section */}
                            <View className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                                <Text className="font-bold text-lg text-slate-900 dark:text-white mb-2">Personal Information</Text>

                                {profileError ? (
                                    <View className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                                        <Text className="text-red-600 dark:text-red-400 text-sm font-medium">{profileError}</Text>
                                    </View>
                                ) : null}

                                {profileSuccess ? (
                                    <View className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
                                        <Text className="text-green-600 dark:text-green-400 text-sm font-medium">{profileSuccess}</Text>
                                    </View>
                                ) : null}

                                <View className="gap-2">
                                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</Text>
                                    <TextInput
                                        value={user?.email}
                                        editable={false}
                                        className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-500 dark:text-slate-400"
                                    />
                                </View>
                                <View className="gap-2">
                                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</Text>
                                    <TextInput
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Your Name"
                                        placeholderTextColor="#94a3b8"
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                                    />
                                </View>
                                <Pressable
                                    onPress={() => updateProfile({ full_name: fullName, avatar_url: avatarUrl })}
                                    disabled={loading}
                                    className="bg-slate-900 dark:bg-white active:bg-slate-800 dark:active:bg-slate-200 p-4 rounded-lg items-center mt-2"
                                >
                                    <Text className="text-white dark:text-slate-900 font-bold text-base">
                                        {loading ? "Saving..." : "Save Changes"}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Security Section */}
                            <View className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                                <Text className="font-bold text-lg text-slate-900 dark:text-white mb-2">Security</Text>

                                {securityError ? (
                                    <View className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                                        <Text className="text-red-600 dark:text-red-400 text-sm font-medium">{securityError}</Text>
                                    </View>
                                ) : null}

                                {securitySuccess ? (
                                    <View className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
                                        <Text className="text-green-600 dark:text-green-400 text-sm font-medium">{securitySuccess}</Text>
                                    </View>
                                ) : null}

                                <Pressable
                                    onPress={async () => {
                                        if (!user?.email) return;
                                        try {
                                            setLoading(true);
                                            setSecurityError('');
                                            setSecuritySuccess('');
                                            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                                redirectTo: `${window.location.origin}/update-password`,
                                            });
                                            if (error) throw error;
                                            setSecuritySuccess('Check your email for a password reset link.');
                                        } catch (e: any) {
                                            setSecurityError(e.message || "Failed to send reset link");
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 p-4 rounded-lg items-center"
                                >
                                    <Text className="text-slate-900 dark:text-white font-medium text-base">
                                        Reset Password
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => signOut()}
                                    className="bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 p-4 rounded-lg items-center"
                                >
                                    <Text className="text-slate-900 dark:text-white font-medium text-base">
                                        Sign Out
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Danger Zone */}
                            <View className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-200 dark:border-red-900/30 gap-4 mt-4">
                                <Text className="font-bold text-lg text-red-600 dark:text-red-400 mb-2">Danger Zone</Text>
                                <Text className="text-red-600/80 dark:text-red-400/80 text-sm mb-2">
                                    Once you delete your account, there is no going back. Please be certain.
                                </Text>
                                <Pressable
                                    onPress={async () => {
                                        const confirmText = 'Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.';

                                        const proceedWithDelete = async () => {
                                            try {
                                                setLoading(true);
                                                const { error } = await supabase.rpc('delete_user');
                                                if (error) throw error;
                                                if (Platform.OS === 'web') {
                                                    window.alert('Your account has been deleted.');
                                                } else {
                                                    Alert.alert('Deleted', 'Your account has been deleted.');
                                                }
                                                signOut();
                                            } catch (e: any) {
                                                if (Platform.OS === 'web') {
                                                    window.alert('Error Deleting Account: ' + e.message);
                                                } else {
                                                    Alert.alert('Error Deleting Account', e.message);
                                                }
                                            } finally {
                                                setLoading(false);
                                            }
                                        };

                                        if (Platform.OS === 'web') {
                                            if (window.confirm(confirmText)) {
                                                proceedWithDelete();
                                            }
                                        } else {
                                            Alert.alert(
                                                'Delete Account',
                                                confirmText,
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete',
                                                        style: 'destructive',
                                                        onPress: proceedWithDelete
                                                    }
                                                ]
                                            );
                                        }
                                    }}
                                    disabled={loading}
                                    className="bg-red-600 active:bg-red-700 p-4 rounded-lg items-center"
                                >
                                    <Text className="text-white font-bold text-base">
                                        Delete Account
                                    </Text>
                                </Pressable>
                            </View>

                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
