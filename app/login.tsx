import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password'>(mode === 'signup' ? 'signup' : 'signin');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const turnstileRef = useRef<TurnstileInstance>(null);
    const [turnstileToken, setTurnstileToken] = useState<string>('');

    const handleAuth = async () => {
        // Enforce Turnstile Token on Web
        if (Platform.OS === 'web' && process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
            setErrorMsg('Waiting for human verification. Please try again in a few seconds.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            if (authMode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { captchaToken: turnstileToken }
                });
                if (error) throw error;
                setSuccessMsg('Check your email for the confirmation link!');
            } else if (authMode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options: { captchaToken: turnstileToken }
                });
                if (error) throw error;
                router.replace('/(tabs)');
            } else if (authMode === 'forgot_password') {
                const resetUrl = Platform.OS === 'web'
                    ? `${window.location.origin}/update-password`
                    : 'namenia://update-password';

                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: resetUrl,
                    captchaToken: turnstileToken
                });
                if (error) throw error;
                setSuccessMsg('Password reset instructions sent to your email.');
            }
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
            // Reset the Turnstile token so a new one is generated for the next attempt
            if (Platform.OS === 'web') {
                turnstileRef.current?.reset();
                setTurnstileToken('');
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="flex-grow justify-center p-6">
                    <View className="w-full max-w-md mx-auto gap-6">
                        <View className="items-center">
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                                {authMode === 'signup' ? 'Create Account' : authMode === 'signin' ? 'Welcome Back' : 'Reset Password'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
                                {authMode === 'signup' ? 'Sign up to get started' : authMode === 'signin' ? 'Sign in to continue' : 'Enter your email and we will send you a reset link'}
                            </Text>
                        </View>

                        <View className="gap-4">
                            {errorMsg ? (
                                <View className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/30">
                                    <Text className="text-red-600 dark:text-red-400 text-sm font-medium">{errorMsg}</Text>
                                </View>
                            ) : null}

                            {successMsg ? (
                                <View className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/30">
                                    <Text className="text-green-600 dark:text-green-400 text-sm font-medium">{successMsg}</Text>
                                </View>
                            ) : null}

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

                            {authMode !== 'forgot_password' && (
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
                            )}

                            {Platform.OS === 'web' && process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY && (
                                <View className="items-center my-2">
                                    <Turnstile
                                        ref={turnstileRef}
                                        siteKey={process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY}
                                        onSuccess={setTurnstileToken}
                                    />
                                </View>
                            )}

                            <Pressable
                                onPress={handleAuth}
                                disabled={loading || !email || (authMode !== 'forgot_password' && !password) || (Platform.OS === 'web' && !turnstileToken)}
                                className="bg-blue-600 active:bg-blue-700 disabled:opacity-50 p-4 rounded-lg items-center mt-2"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {authMode === 'signup' ? 'Sign Up' : authMode === 'signin' ? 'Sign In' : 'Send Reset Link'}
                                    </Text>
                                )}
                            </Pressable>

                            {authMode !== 'forgot_password' && (
                                <>
                                    <Pressable
                                        onPress={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                                        className="items-center p-2"
                                    >
                                        <Text className="text-blue-600 dark:text-blue-400">
                                            {authMode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                        </Text>
                                    </Pressable>

                                    {authMode === 'signin' && (
                                        <Pressable
                                            onPress={() => setAuthMode('forgot_password')}
                                            className="items-center p-2"
                                        >
                                            <Text className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
                                                Forgot Password?
                                            </Text>
                                        </Pressable>
                                    )}
                                </>
                            )}

                            {authMode === 'forgot_password' && (
                                <Pressable
                                    onPress={() => setAuthMode('signin')}
                                    className="items-center p-2"
                                >
                                    <Text className="text-blue-600 dark:text-blue-400">
                                        Back to Sign In
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
