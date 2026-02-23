import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordScreen() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const router = useRouter();

    const handleUpdatePassword = async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;
            setSuccessMsg('Password updated successfully!');
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="flex-grow justify-center p-6">
                    <View className="w-full max-w-md mx-auto gap-6">
                        <View className="items-center">
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                                Update Password
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 mt-2">
                                Enter your new password below.
                            </Text>
                        </View>

                        <View className="gap-4">
                            <View className="gap-2">
                                <Text className="text-slate-700 dark:text-slate-300 font-medium">New Password</Text>
                                <TextInput
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {errorMsg ? (
                                <View className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/30">
                                    <Text className="text-red-600 dark:text-red-400 text-sm font-medium">{errorMsg}</Text>
                                </View>
                            ) : null}

                            {successMsg ? (
                                <View className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/30">
                                    <Text className="text-green-600 dark:text-green-400 text-sm font-medium">{successMsg}</Text>
                                    <Pressable
                                        onPress={() => router.replace('/(tabs)')}
                                        className="bg-green-600 active:bg-green-700 p-3 rounded-lg items-center mt-4"
                                    >
                                        <Text className="text-white font-bold">Go to Profile</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable
                                    onPress={handleUpdatePassword}
                                    disabled={loading || !password}
                                    className="bg-blue-600 active:bg-blue-700 disabled:opacity-50 p-4 rounded-lg items-center mt-2"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-base">
                                            Update Password
                                        </Text>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
