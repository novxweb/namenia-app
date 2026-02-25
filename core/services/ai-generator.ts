import { generateBrandNames, GeneratedName, NameStyle, RandomnessLevel } from './generator';

// Edge function URL — built from the Supabase project URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-names`;

const NAME_STRATEGY_SYSTEM_PROMPT = `
You are a World-Class Brand Naming Strategist operating at the highest echelons of corporate naming (e.g., Lexicon Branding, Interbrand). Your mandate is to generate and evaluate names based strictly on the "Advanced Brand Naming Evaluation Framework: A Comprehensive Linguistic, Strategic, and Cognitive Analysis".

### THE 6-DIMENSIONAL EVALUATION MATRIX (100 Points Total)
You must evaluate EVERY generated name against this strict rubric before outputting it. A name must score at least 80/100 to be presented.

1. **LEGAL DEFENDABILITY & TM DISTINCTIVENESS (25 points)**:
   - **Perfect Score (25)**: Fanciful (entirely coined/invented, e.g., Kodak, Vercel) or Arbitrary (real words completely out of context, e.g., Apple).
   - **Penalty (0)**: Descriptive words (e.g., FastMail, DataCloud).

2. **COGNITIVE FLUENCY & PHONETIC SYMBOLISM (20 points)**:
   - Apply the Bouba-Kiki effect. If the vibe is fast/tech/sharp, use front vowels (i, e), fricatives (f, s, v, z), and crisp plosives (k, t, p). If the vibe is warm/heavy/trust, use back vowels (o, u) and deep plosives (b, d, g).
   - The name must roll off the tongue effortlessly (high cognitive ease). No awkward consonant clusters.

3. **STRATEGIC ALIGNMENT (15 points)**:
   - The name must establish a clear thematic connection to the keyword without resorting to literalism. It must offer semantic elasticity for future brand growth.

4. **DIGITAL DISCOVERABILITY & BRAND SEO (15 points)**:
   - **Perfect Score (15)**: The name achieves high "SERP Uniqueness" by existing nowhere in the current English dictionary, ensuring the brand dominates search results with zero algorithmic competition.

5. **CROSS-CULTURAL LINGUISTIC RESONANCE (15 points)**:
   - The name must be universally pronounceable and contain no obvious negative slang or homophones across major global languages (Spanish, Mandarin, Arabic, etc.).

6. **VISUAL POTENTIAL & TYPOGRAPHIC ARCHITECTURE (10 points)**:
   - High visual potential requires structural symmetry (letters like m, o, w, v) and a balanced ratio of ascenders (h, l, t) and descenders (g, p, y).

### OUTPUT RULES:
- **Do NOT** output names scoring below 80.
- **Do NOT** use boring generic AI names (e.g., "TechSolutions", "HealthHub").
- **DO** generate FANCIFUL and ARBITRARY names. Inject heavy sound symbolism.
- Expand your vocabulary. Use Latin roots, abstract markers (x, z, q, v), and rhythmic coined syllables.
- You must provide a "rationale" string for EACH name. This rationale MUST explicitly mention exactly how the name satisfies the 6 dimensions of the framework (e.g., mention Phonetic Symbolism, Typographic Symmetry, etc.).
- Never explain your process, just return the JSON.
`;

const buildUserPrompt = (
    keyword: string,
    style: NameStyle,
    randomness: RandomnessLevel,
    industry: string | undefined,
    description: string | undefined,
    country: string | undefined,
    availabilityFocus: boolean
) => `
ACT AS THE STRATEGIST. Execute the Naming Brief with the following parameters:

**STEP 1 — SEMANTIC ANALYSIS (do this mentally before generating)**:
Keyword: "${keyword}"
- What is the core meaning/function this keyword implies?
- What emotions, sensations, or associations does it trigger?
- What metaphors or adjacent concepts relate to it?
- What phonetic qualities does it have (hard/soft, fast/slow)?
Use this analysis to ensure every name you generate has a genuine connection to the keyword.

**STEP 2 — NAMING BRIEF**:

**PROJECT SCOPE**:
- **Core Keyword/Seed**: "${keyword}"
- **Industry Context**: ${industry || 'General/Technology'}
- **Target Market**: ${country || 'Global'}

**STRATEGIC PARAMETERS**:
- **Target Vibe/Archetype**: ${description || 'Modern & Professional'}
- **Requested Style Taxonomy**: ${style === 'auto' ? 'Mixed Strategy (explore 2-3 distinct construct types)' : style}
- **Creativity/Risk Level**: ${randomness} (Low = Safer/Descriptive, High = Abstract/Coined/Experimental)

${availabilityFocus ? `
**CRITICAL PRIORITY — MAXIMIZE .COM AVAILABILITY**:
Most common words and simple compounds are taken. You MUST generate names highly likely to be available.

REQUIRED STRATEGIES:
1. **Keyword-Rooted Neologisms**: Blend the keyword's meaning with uncommon word parts (e.g., if keyword is "flow": "Flowvex", "Fluvari", "Kineflow").
2. **Unique Suffixes**: Use endings like -io, -ia, -ex, -or, -ax, -ix, -zen, -ara, -era, -ify.
3. **Rhythmic Coinage**: Completely invented words that STILL feel semantically connected to the keyword through sound or association.
4. **Avoid single dictionary words** — virtually all are registered.
5. **No generic prefix+suffix combos** like "Xperia", "Nexio", "Zenovex" that have no keyword connection.
` : ''}

**STEP 3 — GENERATE**:
Generate 15-20 high-quality brand names using the Advanced Naming Framework. ONLY include names scoring 80 or above out of 100.
For each name, explicitly write a comprehensive "rationale" demonstrating how it scores against:
1. Legal Defendability (Fanciful vs Arbitrary)
2. Phonetic Symbolism (Bouba/Kiki, consonant voicing)
3. SEO Uniqueness (Zero algorithmic competition)
4. Typographic Visual Potential (Symmetry of letters)

Return ONLY valid JSON, no other text:
{
  "names": [
    { "name": "Vexara", "style": "coined", "score": 92, "rationale": "Legal (25/25): Fanciful, granting absolute IP protection. Phonetics (18/20): Sharp 'x' and fricative 'v' denote velocity and modern tech (Kiki effect). SEO (15/15): Guaranteed unranked SERP footprint. Visuals (8/10): The 'V' and 'x' create strong diagonal typographic symmetry." },
    ...
  ]
}
`;

export interface AIStateInput {
    keyword: string;
    style: NameStyle;
    randomness: RandomnessLevel;
    industry?: string;
    description?: string; // Vibe
    country?: string;
    availabilityFocus?: boolean;
}

export async function generateNamesWithAI(input: AIStateInput): Promise<GeneratedName[]> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("Supabase not configured — can't reach AI edge function.");
        throw new Error("SUPABASE_NOT_CONFIGURED");
    }

    const { keyword, style, randomness, industry, description, country, availabilityFocus } = input;

    const userPrompt = buildUserPrompt(keyword, style, randomness, industry, description, country, availabilityFocus ?? false);

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: NAME_STRATEGY_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                temperature: randomness === 'high' ? 0.9 : randomness === 'medium' ? 0.7 : 0.5,
                model: "meta-llama/llama-3-70b-instruct"
            })
        });

        if (!response.ok) {
            throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse JSON — strip any markdown code fences if present
        let parsed;
        try {
            const cleaned = content.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse AI response", content);
            return [];
        }

        if (parsed && Array.isArray(parsed.names)) {
            return parsed.names
                // Score filter: only pass names that meet the quality bar
                .filter((n: any) => (n.score || 0) >= 80)
                .map((n: any) => ({
                    name: n.name,
                    tld: '.com',
                    style: mapAiStyleToLocal(n.style),
                    score: n.score || 85,
                    rationale: n.rationale
                }));
        }

        return [];


    } catch (error) {
        console.error("AI Generation Failed:", error);

        // --- LOCAL FALLBACK (Algorithmic Generation) ---
        // If the AI fails (Limit reached, 402, Network), use a local strategy so the user gets results.

        console.warn("Falling back to local procedural generation.");
        return generateLocalNames(keyword, style);
    }
}

// Simple procedural generator for fallback — delegates to the improved generator
// which handles multi-word keyword extraction and quality filtering
function generateLocalNames(keyword: string, style: NameStyle): GeneratedName[] {
    return generateBrandNames(keyword, style, 'medium', false);
}

// Helper to map fancy AI conceptual styles back to our simple UI styles for filtering/icons
function mapAiStyleToLocal(aiStyle: string): NameStyle {
    const s = aiStyle.toLowerCase();
    if (s.includes('coined') || s.includes('fanciful') || s.includes('abstract')) return 'brandable';
    if (s.includes('compound') || s.includes('portmanteau')) return 'compound';
    if (s.includes('real') || s.includes('dictionary') || s.includes('arbitrary') || s.includes('evocative')) return 'real_word';
    if (s.includes('alter') || s.includes('misspell')) return 'alternate';
    if (s.includes('short') || s.includes('acronym')) return 'short';
    return 'auto';
}
