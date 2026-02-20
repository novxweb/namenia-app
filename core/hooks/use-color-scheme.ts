import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * A hydration-safe wrapper around useColorScheme.
 * It ensures the server and initial client render always agree (e.g. 'light'),
 * avoiding Minified React Error #418/423.
 */
export function useColorScheme() {
    const systemScheme = useNativeColorScheme();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return 'light';
    }

    return systemScheme;
}
