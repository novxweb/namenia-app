import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable, Image, Platform, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useShortlist } from '@/core/contexts/ShortlistContext';
import { ShortlistCard } from '@/components/generator/ShortlistCard';
import { Download, Plus, Folder as FolderIcon } from 'lucide-react-native';
import { GeneratedName } from '@/core/services/generator';

function buildCSV(items: GeneratedName[]): string {
    // Gather all unique TLDs and social platforms across all items
    const allTlds = new Set<string>();
    const allSocials = new Set<string>();

    for (const item of items) {
        if (item.availability?.domains) {
            for (const d of item.availability.domains) {
                allTlds.add(d.tld);
            }
        }
        if (item.availability?.socials) {
            for (const key of Object.keys(item.availability.socials)) {
                allSocials.add(key);
            }
        }
    }

    const tldCols = Array.from(allTlds).sort();
    const socialCols = Array.from(allSocials).sort();

    // Header
    const headers = [
        'Name',
        'Style',
        'Score',
        ...tldCols.map(t => `.${t}`),
        ...socialCols.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    ];

    const rows = items.map(item => {
        const domainMap: Record<string, boolean> = {};
        if (item.availability?.domains) {
            for (const d of item.availability.domains) {
                domainMap[d.tld] = d.available;
            }
        }
        const socialMap: Record<string, boolean> = {};
        if (item.availability?.socials) {
            for (const [k, v] of Object.entries(item.availability.socials)) {
                socialMap[k] = !!v;
            }
        }

        return [
            `"${item.name}"`,
            item.style || '',
            String(item.score || ''),
            ...tldCols.map(t => domainMap[t] === true ? 'Available' : domainMap[t] === false ? 'Taken' : ''),
            ...socialCols.map(s => socialMap[s] === true ? 'Available' : socialMap[s] === false ? 'Taken' : ''),
        ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadCSVWeb(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function downloadCSVNative(csv: string, filename: string) {
    try {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv);
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
        } else {
            Alert.alert('Saved', `CSV saved to ${fileUri}`);
        }
    } catch (e) {
        console.error('Native CSV export failed:', e);
        Alert.alert('Error', 'Could not export CSV.');
    }
}

export default function ShortlistScreen() {
    const router = useRouter();
    const { shortlist, folders, selectedFolderId, setSelectedFolderId, getNamesByFolder } = useShortlist();
    const [showAllFolders, setShowAllFolders] = useState(false);

    const handleExportCSV = () => {
        const items = selectedFolderId === '' ? shortlist : getNamesByFolder(selectedFolderId);
        if (items.length === 0) {
            Alert.alert('Nothing to export', 'Add some names to your shortlist first.');
            return;
        }

        const csv = buildCSV(items);
        const filename = `namenia-shortlist-${new Date().toISOString().slice(0, 10)}.csv`;

        if (Platform.OS === 'web') {
            downloadCSVWeb(csv, filename);
        } else {
            downloadCSVNative(csv, filename);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <View className="bg-white dark:bg-slate-900 px-4 py-3 md:px-8 md:py-4 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <Link href="/" asChild>
                        <Pressable>
                            <Image
                                source={require('@/assets/namenia_logo_black_transparent.png')}
                                style={{ width: 120, height: 35, resizeMode: 'contain' }}
                            />
                        </Pressable>
                    </Link>
                </View>

                <View className="flex-row items-center gap-2">

                    <Pressable
                        onPress={handleExportCSV}
                        className="flex-row items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                        <Download size={16} color="#047857" />
                        <Text className="text-emerald-700 font-bold text-sm">Export CSV</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerClassName="p-4 md:p-8 max-w-5xl mx-auto w-full pb-24">
                <View className="mb-6">
                    <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2">Your Shortlist</Text>
                    <Text className="text-slate-500 text-lg">{shortlist.length} names saved for review</Text>
                </View>

                {/* Folder Filter Tabs */}
                {folders.length > 0 && shortlist.length > 0 && (
                    <View className="mb-6">
                        <View className="flex-row flex-wrap gap-2">
                            {/* All Names Tab */}
                            <Pressable
                                onPress={() => setSelectedFolderId('')}
                                className={`px-4 py-2 rounded-full border ${selectedFolderId === ''
                                    ? 'bg-purple-100 border-purple-200 dark:bg-purple-900/40 dark:border-purple-700'
                                    : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                    }`}
                            >
                                <Text className={`font-semibold ${selectedFolderId === ''
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                    All ({shortlist.length})
                                </Text>
                            </Pressable>

                            {/* Folder Tabs */}
                            {folders.map((folder) => {
                                const count = getNamesByFolder(folder.id).length;
                                if (count === 0) return null;
                                return (
                                    <Pressable
                                        key={folder.id}
                                        onPress={() => setSelectedFolderId(folder.id)}
                                        className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${selectedFolderId === folder.id
                                            ? 'border-2'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            }`}
                                        style={{
                                            backgroundColor: selectedFolderId === folder.id ? `${folder.color}15` : undefined,
                                            borderColor: selectedFolderId === folder.id ? folder.color : undefined
                                        }}
                                    >
                                        <View
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: folder.color }}
                                        />
                                        <Text
                                            className="font-semibold"
                                            style={{ color: selectedFolderId === folder.id ? folder.color : '#64748b' }}
                                        >
                                            {folder.name} ({count})
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}

                {shortlist.length === 0 ? (
                    <View className="items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                        <View className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full items-center justify-center mb-4">
                            <Plus size={32} color="#94a3b8" />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your shortlist is empty</Text>
                        <Text className="text-slate-500 mb-6">Go back and save some magical names!</Text>
                        <Pressable
                            onPress={() => router.push('/')}
                            className="bg-purple-600 px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-bold">Generate Names</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View className="gap-4">
                        {(selectedFolderId === '' ? shortlist : getNamesByFolder(selectedFolderId)).map((item, index) => (
                            <ShortlistCard key={`${item.name}-${index}`} result={item} />
                        ))}
                    </View>
                )}
            </ScrollView>

        </SafeAreaView>
    );
}
