import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const isSignUp = mode === 'signup';

    // Redirect signup mode to home
    React.useEffect(() => {
        if (isSignUp) {
            router.replace('/');
        }
    }, [isSignUp]);

    const handleAuth = async () => {
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.replace('/(tabs)');
            }
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
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 mt-2">
                                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
                            </Text>
                        </View>

                        <View className="gap-4">
                            <View className="gap-2">
                                <Text className="text-slate-700 dark:text-slate-300 font-medium">Email</Text>
                                <TextInput
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                                    placeholder="name@example.com"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View className="gap-2">
                                <Text className="text-slate-700 dark:text-slate-300 font-medium">Password</Text>
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
                                onPress={handleAuth}
                                disabled={loading}
                                className="bg-blue-600 active:bg-blue-700 p-4 rounded-lg items-center mt-2"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {isSignUp ? 'Sign Up' : 'Sign In'}
                                    </Text>
                                )}
                            </Pressable>

                            {/* HIDDEN FOR NOW
                            <Pressable
                                onPress={() => router.setParams({ mode: isSignUp ? 'signin' : 'signup' })}
                                className="items-center p-2"
                            >
                                <Text className="text-blue-600 dark:text-blue-400">
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </Text>
                            </Pressable>
                            */}
                            <Pressable
                                onPress={() => router.push('/update-password')}
                                className="items-center p-2"
                            >
                                <Text className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
                                    Forgot Password?
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
