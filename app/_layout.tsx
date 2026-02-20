import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { Platform } from 'react-native';

import { APP_VERSION } from '@/core/config/version';

import { useTheme, ThemeProvider } from '@/core/contexts/ThemeContext';
import { AuthProvider } from '@/core/contexts/AuthContext';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';

// Wrapper to consume ThemeContext for Navigation Theme
function RootLayoutContent() {
    const { activeScheme } = useTheme();
    const pathname = usePathname();

    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    return (
        <NavigationThemeProvider value={activeScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="update-password" options={{ headerShown: false }} />

                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            <StatusBar style={activeScheme === 'dark' ? 'light' : 'dark'} />

        </NavigationThemeProvider>
    );
}

import { ShortlistProvider } from '@/core/contexts/ShortlistContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ShortlistProvider>
                    <RootLayoutContent />
                </ShortlistProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
