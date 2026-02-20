import { Platform } from "react-native";

export const initAnalytics = () => {
    // GA initialization logic or GTM injection
};

export const trackPageView = (path: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-ignore
        window.gtag('config', 'G-N24Q4YYRXZ', {
            page_path: path,
        });
    }
};
