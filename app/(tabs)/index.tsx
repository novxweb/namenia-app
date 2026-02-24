
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    Pressable,
    useWindowDimensions,
    Image,
    Platform
} from 'react-native';
import { Stack, Link } from 'expo-router';
import { Sparkles, List, Grid, Heart } from 'lucide-react-native';
import { cn } from '@/core/utils/cn';
import { generateNamesWithAI } from '@/core/services/ai-generator';
import { checkAvailability } from '@/core/services/availability';
import { generateBrandNames, GeneratedName, NameStyle, RandomnessLevel } from '@/core/services/generator';
import { INDUSTRIES, COUNTRIES, TLDS, SOCIALS } from '@/core/constants';
import { ResultCard } from '@/components/generator/ResultCard';
import { Sidebar } from '@/components/generator/Sidebar';
import { useShortlist } from '@/core/contexts/ShortlistContext';
import { AuthContext } from '@/core/contexts/AuthContextValue';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GeneratorScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const router = useRouter();

    const { shortlist } = useShortlist();
    const { session } = useContext(AuthContext) || {};

    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<GeneratedName[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(isDesktop ? 'grid' : 'list');


    // Filters / Options - Managed by Sidebar
    const [selectedStyle, setSelectedStyle] = useState<NameStyle>('auto');
    const [randomness, setRandomness] = useState<RandomnessLevel>('medium');
    const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0]);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [selectedVibe, setSelectedVibe] = useState('');
    const [selectedTlds, setSelectedTlds] = useState<string[]>(['com']);
    const [selectedSocials, setSelectedSocials] = useState<string[]>([]);

    const [statusMessage, setStatusMessage] = useState('');
    const BATCH_SIZE = 6;
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
    const [autoGenerate, setAutoGenerate] = useState(false);


    // Effect 1: Read ?q= param from URL on mount and pre-fill keyword
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const q = params.get('q') || '';
            if (q.trim()) {
                setKeyword(q.trim());
                setAutoGenerate(true); // Signal effect 2 to fire
            }
        }
    }, []);

    // Effect 2: Auto-generate once the URL keyword has been committed to state
    useEffect(() => {
        if (autoGenerate && keyword.trim()) {
            setAutoGenerate(false);
            handleGenerate(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerate, keyword]);

    // Effect 3: Check for pending generations after successful login
    useEffect(() => {
        if (session) {
            const checkPending = async () => {
                const pendingStateStr = await AsyncStorage.getItem('pendingGenerationState');
                if (pendingStateStr) {
                    try {
                        const state = JSON.parse(pendingStateStr);
                        if (state.keyword) setKeyword(state.keyword);
                        if (state.selectedStyle) setSelectedStyle(state.selectedStyle);
                        if (state.randomness) setRandomness(state.randomness);
                        if (state.selectedIndustry) setSelectedIndustry(state.selectedIndustry);
                        if (state.selectedCountry) setSelectedCountry(state.selectedCountry);
                        if (state.selectedVibe) setSelectedVibe(state.selectedVibe);
                        if (state.selectedTlds) setSelectedTlds(state.selectedTlds);
                        if (state.selectedSocials) setSelectedSocials(state.selectedSocials);
                        if (state.selectedLanguages) setSelectedLanguages(state.selectedLanguages);
                    } catch (e) {
                        console.error("Failed to parse pending state");
                    }
                    await AsyncStorage.removeItem('pendingGenerationState');
                    setAutoGenerate(true);
                } else {
                    // Fallback for older stored formats
                    const oldPending = await AsyncStorage.getItem('pendingKeyword');
                    if (oldPending) {
                        setKeyword(oldPending);
                        await AsyncStorage.removeItem('pendingKeyword');
                        setAutoGenerate(true);
                    }
                }
            };
            checkPending();
        }
    }, [session]);

    const handleGenerate = async (append: boolean = false) => {
        if (!keyword.trim()) return;

        // AUTHENTICATION GATE
        if (!session) {
            const pendingState = {
                keyword: keyword.trim(),
                selectedStyle,
                randomness,
                selectedIndustry,
                selectedCountry,
                selectedVibe,
                selectedTlds,
                selectedSocials,
                selectedLanguages
            };
            await AsyncStorage.setItem('pendingGenerationState', JSON.stringify(pendingState));
            router.push('/login');
            return;
        }



        setLoading(true);
        // If it's a new search, clear previous results immediately
        if (!append) {
            setResults([]);
        }

        let newValidNames: GeneratedName[] = [];
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        try {
            // Loop until we find enough names or hit max attempts
            while (newValidNames.length < 4 && attempts < MAX_ATTEMPTS) {
                attempts++;
                const isGettingDesperate = attempts > 1;

                setStatusMessage(
                    attempts === 1
                        ? 'Dreaming up names...'
                        : isGettingDesperate
                            ? `Digging deeper for available gems... (Attempt ${attempts}/${MAX_ATTEMPTS})`
                            : `Iterating... (Attempt ${attempts}/${MAX_ATTEMPTS})`
                );

                // 1. Generate Candidates
                let candidates: GeneratedName[] = [];
                try {
                    candidates = await generateNamesWithAI({
                        keyword,
                        style: selectedStyle,
                        randomness,
                        industry: selectedIndustry !== INDUSTRIES[0] ? selectedIndustry : undefined,
                        description: selectedVibe ? `Vibe: ${selectedVibe}` : undefined,
                        availabilityFocus: isGettingDesperate
                    });
                } catch (e) {
                    console.error('AI Generation failed:', e);
                    candidates = generateBrandNames(keyword, selectedStyle, randomness, isGettingDesperate);
                }

                if (!candidates || candidates.length === 0) {
                    candidates = generateBrandNames(keyword, selectedStyle, randomness, isGettingDesperate);
                }

                setStatusMessage(`Checking availability for ${candidates.length} candidates...`);

                // 2. Check Availability
                const checkedCandidates = await Promise.all(candidates.map(async (c) => {
                    try {
                        const availability = await checkAvailability(c.name, selectedTlds, []);
                        return { ...c, availability };
                    } catch (e) { return c; }
                }));

                // 3. Strict Filter
                const validBatch = checkedCandidates.filter(c => {
                    // If no TLDs are selected, accept all candidates (no domain filter)
                    if (selectedTlds.length === 0) return true;
                    return c.availability?.domains?.some(d => d.available);
                });

                newValidNames = [...newValidNames, ...validBatch];

                if (newValidNames.length > 0) {
                    setStatusMessage(`Found ${newValidNames.length} available name${newValidNames.length > 1 ? 's' : ''} so far...`);
                }
            }

            if (append) {
                // Deduplicate: only add names not already in the list
                setResults(prev => {
                    const existingNames = new Set(prev.map(r => r.name.toLowerCase()));
                    const deduplicated = newValidNames.filter(n => !existingNames.has(n.name.toLowerCase()));
                    return [...deduplicated, ...prev];
                });
            } else {
                setResults(newValidNames);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    const ResultsContent = () => (
        <View>
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                Name Generator
            </Text>



            {/* Toolbar / Results Header - Styled as a Card */}
            <View className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 flex-row justify-between items-center">
                <Text className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    {results.length > 0 ? `${results.length} names generated` : "Start generating names"}
                </Text>

                <View className="flex-row items-center gap-3">
                    {results.length > 0 && (
                        <Pressable
                            onPress={() => setResults([])}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                            <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">Clear</Text>
                        </Pressable>
                    )}

                    <View className="hidden md:flex flex-row gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                        <Pressable onPress={() => setViewMode('list')} className={cn("p-2 rounded-md", viewMode === 'list' ? "bg-white dark:bg-slate-600 shadow-sm" : "")}>
                            <List size={20} color={viewMode === 'list' ? "#0f172a" : "#94a3b8"} />
                        </Pressable>
                        <Pressable onPress={() => setViewMode('grid')} className={cn("p-2 rounded-md", viewMode === 'grid' ? "bg-white dark:bg-slate-600 shadow-sm" : "")}>
                            <Grid size={20} color={viewMode === 'grid' ? "#0f172a" : "#94a3b8"} />
                        </Pressable>
                    </View>
                </View>
            </View>

            {loading ? (
                <View className="items-center justify-center h-[400px]">
                    <ActivityIndicator size="large" color="#00cba0" />
                    <Text className="text-slate-500 dark:text-slate-400 mt-4 font-medium text-center px-4">
                        {statusMessage || 'Generating names...'}
                    </Text>
                </View>
            ) : results.length === 0 && (
                <View className="items-center justify-center h-[400px]">
                    <View className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl items-center justify-center mb-6 rotate-12">
                        <Sparkles size={32} color="#94a3b8" />
                    </View>
                    <Text className="text-slate-500">Ready to generate?</Text>
                </View>
            )}

            {/* Results Grid */}
            {results.length > 0 && (
                <View>
                    <View className={cn("flex-row flex-wrap", viewMode === 'grid' ? "-mx-2" : "")}>
                        {results.map((result, index) => (
                            <View
                                key={`${result.name}-${index}`}
                                className={cn(
                                    "mb-4",
                                    viewMode === 'grid' || !isDesktop ? "w-full md:w-1/2 lg:w-1/3 px-2" : "w-full"
                                )}
                            >
                                <ResultCard result={result} index={index} />
                            </View>
                        ))}
                    </View>

                    {/* Generate More Names Button - at bottom */}
                    <Pressable
                        onPress={() => handleGenerate(true)}
                        disabled={loading}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer' } as any}
                        className={cn(
                            "mt-6 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 items-center flex-row justify-center gap-2 shadow-sm",
                            loading && "opacity-60"
                        )}
                    >
                        <Sparkles size={18} color={loading ? "#94a3b8" : "#00cba0"} />
                        <Text className={cn("font-semibold", loading ? "text-slate-400" : "text-slate-700 dark:text-slate-200")}>
                            {loading ? "Generating..." : "Generate More Names"}
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                stickyHeaderIndices={[0]}
            >
                {/* Header - Sticky */}
                <View className="bg-white dark:bg-slate-900 px-4 py-3 md:px-8 md:py-4 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between z-50">
                    <View className="flex-row items-center gap-4">
                        <Image
                            source={require('@/assets/namenia_logo_black_transparent.png')}
                            style={{ width: 120, height: 35, resizeMode: 'contain' }}
                        />
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Link href="/shortlist" asChild>
                            <Pressable className="flex-row items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100">
                                <ShortlistButtonContent />
                            </Pressable>
                        </Link>
                    </View>
                </View>

                {/* Main Content */}
                <View className="flex-1 flex-col md:flex-row bg-slate-50 dark:bg-slate-900 p-4 md:p-6 gap-6">
                    {/* Sidebar */}
                    <View
                        className="w-full md:w-80 shrink-0"
                        style={isDesktop ? { position: 'sticky', top: 90, alignSelf: 'flex-start', maxHeight: '80vh' } as any : undefined}
                    >
                        <Sidebar
                            keyword={keyword} setKeyword={setKeyword}
                            selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle}
                            randomness={randomness} setRandomness={setRandomness}
                            selectedIndustry={selectedIndustry} setSelectedIndustry={setSelectedIndustry}
                            selectedVibe={selectedVibe} setSelectedVibe={setSelectedVibe}
                            selectedTlds={selectedTlds} setSelectedTlds={setSelectedTlds}
                            selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}
                            onGenerate={() => handleGenerate(false)}
                            loading={loading}
                        />
                    </View>

                    {/* Results */}
                    <View className="flex-1">
                        <ResultsContent />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function ShortlistButtonContent() {
    const { shortlist } = useShortlist();
    return <Text className="text-emerald-700 font-bold text-sm">Shortlist ({shortlist.length})</Text>;
}
