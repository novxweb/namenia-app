
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, LayoutAnimation } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, Share2, Smartphone, Languages, Settings2, Globe, Scale, BookType } from 'lucide-react-native';
import { cn } from '@/core/utils/cn';
import { NameStyle, RandomnessLevel } from '@/core/services/generator';
import { useTheme } from '@/core/contexts/ThemeContext';
import { INDUSTRIES, VIBES, COUNTRIES, TLDS, LANGUAGES } from '@/core/constants';

// Types
type SectionKey = 'match' | 'domain' | 'language';

interface SidebarProps {
    keyword: string;
    setKeyword: (val: string) => void;
    selectedStyle: NameStyle;
    setSelectedStyle: (val: NameStyle) => void;
    randomness: RandomnessLevel;
    setRandomness: (val: RandomnessLevel) => void;

    // Lifted State
    selectedIndustry: string;
    setSelectedIndustry: (val: string) => void;
    // Country removed
    selectedVibe: string;
    setSelectedVibe: (val: string) => void;

    // Arrays for multi-selects
    selectedTlds: string[];
    setSelectedTlds: (val: string[]) => void;

    selectedLanguages: string[];
    setSelectedLanguages: (val: string[]) => void;

    // Toggle for Social Checks

    onGenerate: () => void;
    loading: boolean;
    collapseTrigger?: number;
}
const STYLES: { id: NameStyle; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'brandable', label: 'Brandable' },
    { id: 'alternate', label: 'Alternate' },
    { id: 'compound', label: 'Compound' },
    { id: 'real_word', label: 'Real Words' },
    { id: 'short', label: 'Short' },
];

const AccordionItem = ({ title, icon: Icon, children, isOpen, onToggle, style }: any) => (
    <View className="border-b border-dashed border-slate-200 dark:border-slate-700" style={style}>
        <Pressable
            onPress={onToggle}
            className="flex-row items-center justify-between py-4"
        >
            <View className="flex-row items-center gap-3">
                <Icon size={18} color="#64748b" />
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</Text>
            </View>
            {isOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </Pressable>
        {isOpen && (
            <View className="pb-4 ml-1">
                {children}
            </View>
        )}
    </View>
);

const CheckboxRow = ({ label, checked, onPress }: { label: string, checked: boolean, onPress: () => void }) => (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-2">
        <View className={cn("w-5 h-5 rounded border items-center justify-center", checked ? "bg-[#00cba0] border-[#00cba0]" : "bg-white border-slate-300 dark:border-slate-600")}>
            {checked && <View className="w-2.5 h-2.5 bg-white rounded-sm" />}
        </View>
        <Text className="text-sm text-slate-700 dark:text-slate-300">{label}</Text>
    </Pressable>
);

export function Sidebar({
    keyword, setKeyword,
    selectedStyle, setSelectedStyle,
    randomness, setRandomness,

    selectedIndustry, setSelectedIndustry,
    // Country removed
    selectedVibe, setSelectedVibe,
    selectedTlds, setSelectedTlds,

    selectedLanguages, setSelectedLanguages,



    onGenerate, loading, collapseTrigger
}: SidebarProps) {
    const { activeScheme } = useTheme();

    const [sections, setSections] = React.useState<Record<SectionKey, boolean>>({
        match: true,
        domain: false,
        language: false,
    });

    // Auto-collapse when triggered
    React.useEffect(() => {
        if (collapseTrigger && collapseTrigger > 0) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSections({ match: false, domain: false, language: false });
        }
    }, [collapseTrigger]);

    const [openDropdown, setOpenDropdown] = React.useState<'industry' | 'country' | null>(null);

    const toggleSection = (key: SectionKey) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSelection = (item: string, current: string[], setFn: (val: string[]) => void) => {
        if (current.includes(item)) {
            setFn(current.filter(i => i !== item));
        } else {
            setFn([...current, item]);
        }
    };

    return (
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                className="md:max-h-[80vh]"
                contentContainerClassName="pb-16"
            >

                {/* Idea & Keywords */}
                <AccordionItem
                    title="Idea & Keywords"
                    icon={Sparkles}
                    isOpen={sections.match}
                    onToggle={() => toggleSection('match')}
                    style={{ zIndex: 100 }}
                >
                    <View className="gap-4">
                        {/* Keyword */}
                        <View>
                            <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Keywords</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white"
                                placeholder="e.g. tech, flow"
                                placeholderTextColor="#94a3b8"
                                value={keyword}
                                onChangeText={setKeyword}
                            />
                        </View>

                        {/* Vibe */}
                        <View>
                            <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Vibe</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {VIBES.map((v) => {
                                    const isSelected = selectedVibe === v;
                                    return (
                                        <Pressable
                                            key={v}
                                            onPress={() => setSelectedVibe(isSelected ? '' : v)}
                                            className={cn(
                                                "border rounded-lg px-3 py-2",
                                                isSelected
                                                    ? "bg-[#00cba0] border-[#00cba0]"
                                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <Text className={cn(
                                                "text-xs",
                                                isSelected ? "text-white font-bold" : "text-slate-700 dark:text-slate-300"
                                            )}>{v}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Industry */}
                        <View className="z-20">
                            <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-1">Industry</Text>
                            <Pressable
                                onPress={() => setOpenDropdown(openDropdown === 'industry' ? null : 'industry')}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex-row justify-between items-center"
                            >
                                <Text className="text-sm text-slate-700 dark:text-slate-300">{selectedIndustry}</Text>
                                <ChevronDown size={16} color="#94a3b8" />
                            </Pressable>
                            {openDropdown === 'industry' && (
                                <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden" style={{ backgroundColor: activeScheme === 'dark' ? '#1e293b' : '#ffffff' }}>
                                    {INDUSTRIES.map((item) => (
                                        <Pressable
                                            key={item}
                                            onPress={() => {
                                                setSelectedIndustry(item);
                                                setOpenDropdown(null);
                                            }}
                                            className={cn(
                                                "px-4 py-3 border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700",
                                                selectedIndustry === item && "bg-emerald-50 dark:bg-emerald-900/20"
                                            )}
                                        >
                                            <Text className={cn(
                                                "text-sm",
                                                selectedIndustry === item ? "text-emerald-600 font-bold" : "text-slate-600 dark:text-slate-300"
                                            )}>{item}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>


                    </View>
                </AccordionItem>

                {/* Availability Filters */}
                <AccordionItem
                    title="Domain Extensions"
                    icon={Globe}
                    isOpen={sections.domain}
                    onToggle={() => toggleSection('domain')}
                >
                    <View className="gap-6">
                        {/* Domains */}
                        <View>
                            <Text className="text-xs font-semibold text-slate-500 mb-2 ml-1">TLDs (Extensions)</Text>
                            <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                                {TLDS.map((tld) => (
                                    <CheckboxRow
                                        key={tld}
                                        label={`.${tld}`}
                                        checked={selectedTlds.includes(tld)}
                                        onPress={() => toggleSelection(tld, selectedTlds, setSelectedTlds)}
                                    />
                                ))}
                            </View>
                        </View>



                        <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                            <Text className="text-xs text-blue-600 dark:text-blue-300 italic">
                                Select specific TLDs to check. If nothing is selected, no availability checks will be performed (fastest).
                            </Text>
                        </View>
                    </View>
                </AccordionItem>



                <View className="mt-8 mb-4">
                    <Pressable
                        onPress={onGenerate}
                        disabled={loading || !keyword.trim()}
                        style={{ cursor: loading || !keyword.trim() ? 'not-allowed' : 'pointer' } as any}
                        className={cn(
                            "bg-[#00cba0] active:bg-[#00b38e] py-4 rounded-xl items-center shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex-row justify-center gap-2",
                            (loading || !keyword.trim()) && "opacity-80"
                        )}
                    >
                        <Sparkles size={20} color="white" />
                        <Text className="text-white font-bold text-base">
                            {loading ? "Generating..." : "Generate Names"}
                        </Text>
                    </Pressable>
                </View>

            </ScrollView>
        </View >
    );
}
