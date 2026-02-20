import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { AvailabilityResult } from '@/core/services/availability';
import { GeneratedName } from '@/core/services/generator';
import { cn } from '@/core/utils/cn';
import { Heart, Copy, Check, Folder } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useShortlist } from '@/core/contexts/ShortlistContext';
import { FolderSelector } from './FolderSelector';

interface ResultCardProps {
    result: GeneratedName;
    index: number;
}

export function ResultCard({ result, index }: ResultCardProps) {
    const { isInShortlist, addToShortlist, removeFromShortlist, folders, shortlist } = useShortlist();
    const availability = result.availability || null;
    const [copied, setCopied] = useState(false);
    const [folderSelectorVisible, setFolderSelectorVisible] = useState(false);

    const isSaved = isInShortlist(result.name);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(result.name);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleSave = () => {
        if (isSaved) {
            removeFromShortlist(result.name);
        } else {
            setFolderSelectorVisible(true);
        }
    };

    const handleFolderSelect = (folderId: string) => {
        addToShortlist(result, folderId);
    };

    const getCurrentFolder = () => {
        const savedItem = shortlist.find(i => i.name === result.name);
        if (!savedItem?.folderId) return null;
        return folders.find(f => f.id === savedItem.folderId);
    };

    const currentFolder = getCurrentFolder();

    const getAffiliateUrl = (name: string, tld: string) => {
        // Namecheap Affiliate Link Pattern
        // REPLACE 'YOUR_AFFILIATE_ID' WITH YOUR ACTUAL IMPACT RADIUS / NAMECHEAP AFFILIATE ID
        const AFFILIATE_ID = 'YOUR_AFFILIATE_ID';
        return `https://www.namecheap.com/domains/registration/results/?domain=${name}.${tld}&aff=${AFFILIATE_ID}`;
    };

    const Badge = ({ label, available, filled = false, tld, name }: { label: string, available: boolean, filled?: boolean, tld: string, name: string }) => {
        const handlePress = () => {
            // Deep link to registrar
            import('react-native').then(({ Linking }) => {
                Linking.openURL(getAffiliateUrl(name, tld));
            });
        };

        return (
            <Pressable onPress={handlePress}>
                <View className={cn(
                    "min-w-[32px] h-6 items-center justify-center rounded px-1.5 mr-1 mb-1 border",
                    available
                        ? (filled ? "bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800" : "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800")
                        : (filled ? "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700" : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700"),
                )}>
                    <Text className={cn(
                        "text-[10px] font-bold",
                        available ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 line-through"
                    )}>
                        {label}
                    </Text>
                </View>
            </Pressable>
        );
    };



    return (
        <>
            <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-full flex-col justify-between hover:shadow-md transition-shadow">

                <View>
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight">
                            {result.name}
                        </Text>
                        <View className="flex-row gap-2">
                            <Pressable
                                onPress={handleCopy}
                                className="p-1.5 rounded-lg active:bg-slate-100 dark:active:bg-slate-700"
                            >
                                {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#94a3b8" />}
                            </Pressable>
                            <Pressable
                                onPress={toggleSave}
                                className="p-1.5 rounded-lg active:bg-slate-100 dark:active:bg-slate-700"
                            >
                                <Heart
                                    size={18}
                                    color={isSaved ? "#ef4444" : "#94a3b8"}
                                    fill={isSaved ? "#ef4444" : "transparent"}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <View className="gap-4">
                        {/* Domains */}
                        {availability?.domains && availability.domains.length > 0 && (
                            <View>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Domains</Text>
                                <View className="flex-row flex-wrap">
                                    {availability.domains.map(d => (
                                        <Badge key={d.tld} label={`.${d.tld}`} available={d.available} filled={d.tld === 'com'} tld={d.tld} name={result.name} />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Fallback for Unknown Status (e.g. API Error) */}
                        {(!availability || !availability.domains || availability.domains.length === 0) && (
                            <View>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Availability</Text>
                                <View className="bg-amber-50 dark:bg-amber-900/20 self-start px-2 py-1 rounded border border-amber-100 dark:border-amber-800">
                                    <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        Status Unknown (Check Failed)
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Socials & Legal Row */}

                    </View>
                </View>

                {/* Folder Badge */}
                {isSaved && currentFolder && (
                    <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <View className="flex-row items-center gap-2">
                            <View
                                className="w-5 h-5 rounded items-center justify-center"
                                style={{ backgroundColor: currentFolder.color }}
                            >
                                <Folder size={12} color="white" />
                            </View>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                                {currentFolder.name}
                            </Text>
                        </View>
                    </View>
                )}

            </View>

            {/* Folder Selector Modal */}
            <FolderSelector
                visible={folderSelectorVisible}
                onClose={() => setFolderSelectorVisible(false)}
                onSelect={handleFolderSelect}
            />
        </>
    );
}


const ChevronDownBasic = () => (
    <View style={{ width: 6, height: 6, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#cbd5e1', transform: [{ rotate: '45deg' }] }} />
);
