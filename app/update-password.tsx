import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordScreen() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;
            Alert.alert('Success', 'Password updated successfully!');
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message);
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

                            <Pressable
                                onPress={handleUpdatePassword}
                                disabled={loading}
                                className="bg-blue-600 active:bg-blue-700 p-4 rounded-lg items-center mt-2"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        Update Password
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
