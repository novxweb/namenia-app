import { Link, Stack } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center p-4">
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View className="items-center">
                <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">This screen doesn't exist.</Text>
                <Text className="text-slate-500 mb-8 text-center">It looks like you've got a broken link.</Text>

                <Link href="/" asChild>
                    <Pressable className="bg-purple-600 px-6 py-3 rounded-xl">
                        <Text className="text-white font-bold">Go to Home Screen</Text>
                    </Pressable>
                </Link>
            </View>
        </SafeAreaView>
    );
}
