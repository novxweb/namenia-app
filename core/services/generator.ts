
export type NameStyle = 'auto' | 'brandable' | 'alternate' | 'compound' | 'real_word' | 'short';
export type RandomnessLevel = 'low' | 'medium' | 'high';

import { AvailabilityResult } from './availability';

export interface GeneratedName {
  name: string;
  tld: string;
  style: NameStyle;
  score: number;
  rationale?: string;
  availability?: AvailabilityResult;
  folderId?: string;
}

// --- Expanded Vocabulary Data ---

const COMPOUND_SUFFIXES = [
  'flow', 'stack', 'hub', 'lab', 'works', 'box', 'source', 'grid', 'core', 'base',
  'space', 'sync', 'desk', 'mind', 'cast', 'ship', 'bird', 'kite', 'pixel', 'byte',
  'sphere', 'wave', 'dash', 'pod', 'dock', 'port', 'gate', 'bridge', 'view', 'sight'
];

const COMPOUND_PREFIXES = [
  'flow', 'snap', 'zen', 'core', 'net', 'data', 'click', 'smart', 'tech', 'hyper',
  'meta', 'cyber', 'digi', 'omni', 'poly', 'uni', 'pro', 'max', 'ultra', 'super',
  'auto', 'dyna', 'flex', 'swift', 'quick', 'flash', 'bright', 'clear', 'bold', 'true'
];

const TECH_ROOTS = [
  'vertex', 'nexus', 'prism', 'flux', 'spark', 'pulse', 'wave', 'sphere', 'arc', 'node',
  'vector', 'pixel', 'logic', 'quantum', 'orbit', 'axis', 'atlas', 'apex', 'aero', 'astra',
  'cipher', 'coder', 'daemon', 'ether', 'helix', 'iodine', 'kinetic', 'lunar', 'matrix', 'nebula',
  'optic', 'phase', 'qubit', 'radar', 'sonic', 'terra', 'unity', 'vision', 'warp', 'zenith'
];

const BRANDABLE_SUFFIXES = [
  'ify', 'ly', 'io', 'ai', 'sys', 'gen', 'ops', 'iq', 'os',
  'ia', 'co', 'is', 'us', 'ix', 'ex', 'on', 'en', 'an', 'ar', 'er'
];

const LATIN_PREFIXES = [
  'nov', 'vel', 'sol', 'ver', 'viv', 'lum', 'aud', 'vis', 'cog', 'scio'
];

const ABSTRACT_MARKERS = [
  'z', 'x', 'q', 'k', 'v'
];

// Common stop words to filter out of multi-word keywords
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'for', 'of', 'in', 'on', 'at', 'to',
  'by', 'up', 'is', 'it', 'my', 'we', 'our', 'with', 'that', 'this', 'from',
  'app', 'application', 'website', 'platform', 'service', 'tool', 'software',
  'based', 'focused', 'driven', 'powered', 'oriented', 'related',
]);

// --- Helpers ---

const removeVowels = (str: string) => str.replace(/[aeiou]/g, '');

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getRandomSubset = <T>(array: T[], count: number): T[] => {
  return shuffleArray(array).slice(0, count);
};

const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Extract the most meaningful root words from a multi-word keyword.
 * "privacy focused mental health app" → ["privacy", "mental", "health"]
 * Then picks 1-2 best roots for name generation.
 */
function extractKeywords(rawKeyword: string): string[] {
  const words = rawKeyword.toLowerCase().trim().split(/\s+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  if (words.length === 0) {
    // Fallback: just use the first word
    const fallback = rawKeyword.toLowerCase().trim().split(/\s+/)[0]?.replace(/[^a-z]/g, '');
    return fallback ? [fallback] : ['brand'];
  }

  // Sort by length (prefer shorter, punchier words) but keep at most 3
  return words
    .sort((a, b) => a.length - b.length)
    .slice(0, 3);
}

/**
 * Quality gate — reject names that look bad.
 * Returns true if the name passes quality checks.
 */
function passesQualityCheck(name: string): boolean {
  const lower = name.toLowerCase();

  // 1. Length: must be 3-14 characters for a brand name
  if (lower.length < 3 || lower.length > 14) return false;

  // 2. Must contain at least one vowel (pronounceability)
  if (!/[aeiouy]/.test(lower)) return false;

  // 3. No triple consecutive consonants (unpronounceable)
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/.test(lower)) return false;

  // 4. No triple consecutive identical characters
  if (/(.)\1{2,}/.test(lower)) return false;

  // 5. No more than 2 consecutive vowels
  if (/[aeiouy]{3,}/.test(lower)) return false;

  return true;
}

// --- Coined Word Generators (HIGH UNIQUENESS) ---

/**
 * Generate truly unique coined words using syllable mixing
 * These have the highest probability of being available as domains
 */
function generateCoinedWords(keyword: string, count: number = 8): string[] {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const consonants = ['n', 'v', 'x', 'r', 'k', 'm', 'l', 'z', 't'];
  const endings = ['ia', 'io', 'os', 'ex', 'ix', 'ara', 'ova', 'ana', 'ino', 'ona'];

  const root = keyword.substring(0, Math.min(keyword.length, 3));
  const results: string[] = [];

  // Pattern 1: root + vowel + consonant + vowel (e.g., "clovana")
  for (let i = 0; i < count / 2; i++) {
    const v1 = randomChoice(vowels);
    const c = randomChoice(consonants);
    const v2 = randomChoice(vowels);
    results.push(`${root}${v1}${c}${v2}`);
  }

  // Pattern 2: root + ending (e.g., "clovia", "cloudex")
  for (let i = 0; i < count / 2; i++) {
    results.push(`${root}${randomChoice(endings)}`);
  }

  return results;
}

/**
 * Blend two unrelated tech words to create unique compounds
 */
function generateBlendedWords(keyword: string, count: number = 6): string[] {
  const techWords = ['quantum', 'cipher', 'nexus', 'prism', 'flux', 'phase', 'orbit', 'zenith'];
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const word = randomChoice(techWords);
    const keyPart = keyword.substring(0, Math.min(keyword.length, 4));
    const wordPart = word.substring(0, 4);

    // Mix them
    if (Math.random() > 0.5) {
      results.push(`${keyPart}${wordPart}`);
    } else {
      results.push(`${wordPart}${keyPart}`);
    }
  }

  return results;
}

// --- Main Generator ---

export function generateBrandNames(keyword: string, style: NameStyle = 'auto', randomness: RandomnessLevel = 'medium', availabilityMode: boolean = false): GeneratedName[] {
  // Extract meaningful root words instead of concatenating the whole phrase
  const keywords = extractKeywords(keyword);
  // Use each keyword root to generate names, then merge
  const allResults: GeneratedName[] = [];
  const limit = 20;

  for (const clean of keywords) {
    if (!clean) continue;

    const results: GeneratedName[] = [];

    // Helper to add results
    const add = (name: string, styleUsed: NameStyle, baseScore: number) => {
      // Randomness factor: Adds noise to score to shuffle ranking slightly
      const variance = Math.random() * (randomness === 'high' ? 30 : randomness === 'medium' ? 15 : 5);
      results.push({
        name: capitalize(name),
        tld: '.com',
        style: styleUsed,
        score: Math.min(100, Math.max(0, baseScore + variance))
      });
    };

    // --- Strategy Execution ---
    // When availability mode is ON or randomness is HIGH, prioritize coined/unique words
    const prioritizeUnique = availabilityMode || randomness === 'high';

    // PRIORITY 1: COINED WORDS (Highest uniqueness/availability)
    if (prioritizeUnique || style === 'auto' || style === 'brandable') {
      const coined = generateCoinedWords(clean, prioritizeUnique ? 10 : 6);
      coined.forEach(name => add(name, 'brandable', 95));

      const blended = generateBlendedWords(clean, prioritizeUnique ? 5 : 3);
      blended.forEach(name => add(name, 'brandable', 93));
    }

    // 2. COMPOUND
    if (style === 'auto' || style === 'compound') {
      // Pick 5 random suffixes and 5 random prefixes
      getRandomSubset(COMPOUND_SUFFIXES, 5).forEach(s => add(`${clean}${s}`, 'compound', 85));
      getRandomSubset(COMPOUND_PREFIXES, 5).forEach(p => add(`${p}${clean}`, 'compound', 80));
    }

    // 3. ALTERNATE
    if (style === 'auto' || style === 'alternate') {
      // Vowel removal
      add(removeVowels(clean), 'alternate', 90);

      // Phonetic swaps (Apply randomly)
      let alt = clean;
      if (alt.includes('c')) alt = alt.replace(/c/g, 'k');
      else if (alt.includes('ph')) alt = alt.replace(/ph/g, 'f');
      else if (alt.includes('x')) alt = alt.replace(/x/g, 'z');
      else alt = alt + 'z'; // Fallback

      if (alt !== clean) add(alt, 'alternate', 88);

      // Random Endings
      add(`${clean}z`, 'alternate', 85);
      add(`${clean}x`, 'alternate', 84);
    }

    // 4. BRANDABLE SUFFIXES
    if (style === 'auto' || style === 'brandable') {
      // Random suffixes
      getRandomSubset(BRANDABLE_SUFFIXES, 6).forEach(s => add(`${clean}${s}`, 'brandable', 92));

      // Latin prefixes + part of keyword
      getRandomSubset(LATIN_PREFIXES, 3).forEach(pre => {
        // e.g. "Nov" + "cloud" -> "Novcloud" or "Novacloud"
        add(`${capitalize(pre)}${clean}`, 'brandable', 86);
      });
    }

    // 5. REAL WORDS / METAPHORICAL
    if (style === 'auto' || style === 'real_word') {
      getRandomSubset(TECH_ROOTS, 5).forEach(w => {
        // Randomly decide: Prefix or Suffix or Standalone replacement?
        const r = Math.random();
        if (r > 0.6) add(`${clean}${w}`, 'real_word', 75); // CloudLogic
        else if (r > 0.3) add(`${w}${clean}`, 'real_word', 75); // LogicCloud
        else add(w, 'real_word', 60); // Just "Logic" (Low score as it ignores keyword)
      });
    }

    // 6. SHORT
    if (style === 'auto' || style === 'short') {
      const short = clean.substring(0, Math.min(clean.length, 4));
      getRandomSubset(['o', 'i', 'a', 'x', 'u'], 3).forEach(char => {
        add(`${short}${char}`, 'short', 85);
      });
    }

    allResults.push(...results);
  }

  // Also generate cross-keyword combinations (e.g. "prive" from "privacy" + "health")
  if (keywords.length >= 2) {
    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const a = keywords[i].substring(0, 3);
        const b = keywords[j].substring(0, 4);
        allResults.push({
          name: capitalize(`${a}${b}`),
          tld: '.com', style: 'brandable',
          score: 90 + Math.random() * 10,
        });
        allResults.push({
          name: capitalize(`${b}${a}`),
          tld: '.com', style: 'brandable',
          score: 90 + Math.random() * 10,
        });
      }
    }
  }

  // Quality filter — remove garbage names
  const quality = allResults.filter(r => passesQualityCheck(r.name));

  // Deduplication
  const unique = new Map<string, GeneratedName>();
  quality.forEach(r => {
    if (!unique.has(r.name)) {
      unique.set(r.name, r);
    }
  });

  // Final Shuffle & Sort
  // We shuffle FIRST to randomize which equal-score items get picked if we have too many.
  // Then we vaguely sort by score but allow some randomness to persist if scores are close.
  let final = Array.from(unique.values());

  if (randomness !== 'low') {
    final = shuffleArray(final);
  }

  // Sort by score (descending)
  final.sort((a, b) => b.score - a.score);

  return final.slice(0, limit);
}
