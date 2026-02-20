import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, LayoutAnimation } from 'react-native';
import { checkAvailability, AvailabilityResult } from '@/core/services/availability';
import { GeneratedName } from '@/core/services/generator';
import { cn } from '@/core/utils/cn';
import { Trash2, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useShortlist } from '@/core/contexts/ShortlistContext';
import { TLDS } from '@/core/constants';

interface ShortlistCardProps {
    result: GeneratedName;
}

export function ShortlistCard({ result }: ShortlistCardProps) {
    const { removeFromShortlist, updateShortlistItem } = useShortlist();
    const [copied, setCopied] = useState(false);
    const [checking, setChecking] = useState(false);
    const [showCheckOptions, setShowCheckOptions] = useState(false);

    // Track which TLDs/socials the user wants to check
    const [selectedTlds, setSelectedTlds] = useState<string[]>(() => {
        // Pre-select TLDs that already have data
        if (result.availability?.domains) {
            return result.availability.domains.map(d => d.tld);
        }
        return [];
    });


    const availability = result.availability;

    const handleCopy = async () => {
        await Clipboard.setStringAsync(result.name);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleTld = (tld: string) => {
        setSelectedTlds(prev =>
            prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld]
        );
    };



    const handleRunChecks = async () => {
        setChecking(true);
        try {
            const tlds = selectedTlds.map(t => t.replace('.', ''));
            const newAvailability = await checkAvailability(result.name, tlds, []);

            // Merge with existing availability data
            const mergedDomains = [...(newAvailability.domains || [])];
            if (availability?.domains) {
                for (const existing of availability.domains) {
                    if (!mergedDomains.find(d => d.tld === existing.tld)) {
                        mergedDomains.push(existing);
                    }
                }
            }

            const mergedAvailability: AvailabilityResult = {
                domains: mergedDomains,
                trademark: newAvailability.trademark || availability?.trademark || { status: 'safe', available: true }
            };

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            const updatedItem: GeneratedName = { ...result, availability: mergedAvailability };
            updateShortlistItem(updatedItem);

            setShowCheckOptions(false);
        } catch (e) {
            console.error('Availability check failed:', e);
        }
        setChecking(false);
    };

    const StatusBadge = ({ label, available, filled = false }: { label: string, available: boolean, filled?: boolean }) => (
        <View className={cn(
            "h-6 items-center justify-center rounded px-2 mr-1 mb-1",
            available
                ? (filled ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-emerald-50 dark:bg-emerald-900/20")
                : (filled ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/50"),
        )}>
            <Text className={cn(
                "text-[10px] font-bold",
                available ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
                {label}
            </Text>
        </View>
    );



    const hasDomains = availability?.domains && availability.domains.length > 0;
    const hasAnyData = hasDomains;

    // Figure out which TLDs/socials are NOT yet checked
    const checkedTlds = new Set(availability?.domains?.map(d => d.tld) || []);
    const uncheckedTlds = TLDS.filter(t => !checkedTlds.has(t));
    const hasUnchecked = uncheckedTlds.length > 0;

    return (
        <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight">
                    {result.name}
                </Text>
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={handleCopy}
                        className="p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-700"
                    >
                        {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} color="#94a3b8" />}
                    </Pressable>
                    <Pressable
                        onPress={() => removeFromShortlist(result.name)}
                        className="p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 hover:bg-rose-50"
                    >
                        <Trash2 size={20} color="#ef4444" />
                    </Pressable>
                </View>
            </View>

            {/* Existing availability data */}
            {hasAnyData && (
                <View className="flex-row flex-wrap gap-8 mb-4">
                    {hasDomains && (
                        <View className="flex-1 min-w-[200px]">
                            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Domain Availability</Text>
                            <View className="gap-2">
                                {availability!.domains.map((d) => (
                                    <View key={d.tld} className="flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">.{d.tld}</Text>
                                        <StatusBadge label={d.available ? "Available" : "Taken"} available={d.available} filled={d.tld === 'com'} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}


                </View>
            )}

            {/* Run More Checks toggle */}
            {hasUnchecked && (
                <View>
                    <Pressable
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowCheckOptions(!showCheckOptions);
                        }}
                        className="flex-row items-center gap-2 py-2"
                    >
                        {showCheckOptions
                            ? <ChevronUp size={14} color="#6366f1" />
                            : <ChevronDown size={14} color="#6366f1" />
                        }
                        <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {hasAnyData ? 'Run more checks' : 'Check availability'}
                        </Text>
                    </Pressable>

                    {showCheckOptions && (
                        <View className="mt-2 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                            {/* TLD Selector */}
                            {uncheckedTlds.length > 0 && (
                                <View className="mb-3">
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Domains</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {uncheckedTlds.map(tld => (
                                            <Pressable
                                                key={tld}
                                                onPress={() => toggleTld(tld)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg border",
                                                    selectedTlds.includes(tld)
                                                        ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/40 dark:border-indigo-700"
                                                        : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                                                )}
                                            >
                                                <Text className={cn(
                                                    "text-xs font-semibold",
                                                    selectedTlds.includes(tld)
                                                        ? "text-indigo-700 dark:text-indigo-300"
                                                        : "text-slate-500 dark:text-slate-400"
                                                )}>
                                                    {tld}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}



                            {/* Run Checks Button */}
                            <Pressable
                                onPress={handleRunChecks}
                                disabled={checking || (selectedTlds.length === 0)}
                                className={cn(
                                    "flex-row items-center justify-center gap-2 py-2.5 rounded-lg mt-1",
                                    checking
                                        ? "bg-slate-200"
                                        : (selectedTlds.length === 0)
                                            ? "bg-slate-100"
                                            : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                            >
                                {checking ? (
                                    <ActivityIndicator size="small" color="#6366f1" />
                                ) : (
                                    <RefreshCw size={14} color={(selectedTlds.length === 0) ? "#94a3b8" : "#ffffff"} />
                                )}
                                <Text className={cn(
                                    "text-sm font-bold",
                                    checking
                                        ? "text-slate-500"
                                        : (selectedTlds.length === 0)
                                            ? "text-slate-400"
                                            : "text-white"
                                )}>
                                    {checking ? 'Checking...' : `Check ${selectedTlds.length} selected`}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
