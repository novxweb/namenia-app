import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '@/core/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/core/contexts/ThemeContext';

export default function TabLayout() {
    const { session, loading } = useAuth();
    const { activeScheme } = useTheme();

    // Wait for session to load
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: activeScheme === 'dark' ? '#0f172a' : '#fff' }}>
                <ActivityIndicator size="large" color={activeScheme === 'dark' ? '#fff' : '#000'} />
            </View>
        );
    }

    // Protect index routes
    // if (!session) {
    //     return <Redirect href="/login" />;
    // }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeScheme === 'dark' ? '#fff' : '#000',
                tabBarStyle: {
                    backgroundColor: activeScheme === 'dark' ? '#1e293b' : '#fff',
                    borderTopColor: activeScheme === 'dark' ? '#334155' : '#e2e8f0',
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Namenia - AI Business Name Generator',
                    tabBarLabel: 'Generate',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="shortlist"
                options={{
                    title: 'Shortlist - Namenia',
                    tabBarLabel: 'Shortlist',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="tests/index"
                options={{
                    href: null,
                    title: 'Tests',
                }}
            />
        </Tabs>
    );
}
