import { generateBrandNames, GeneratedName, NameStyle, RandomnessLevel } from './generator';

// Edge function URL — built from the Supabase project URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-names`;

const NAME_STRATEGY_SYSTEM_PROMPT = `
You are a World-Class Brand Naming Strategist — specifically, a fusion of the best practices from Landor, Interbrand, and Igor Naming Agency. Your mandate is to generate names that a Fortune 500 naming consultancy would be proud to present.

### NON-NEGOTIABLE QUALITY GATES (ALL names must pass):
1. **KEYWORD RELEVANCE**: Every name must have a traceable semantic, phonetic, or conceptual connection to the keyword. If a name could belong to any random brand, reject it.
2. **DISTINCTIVENESS & MODERNITY**: Lazy, generic compound words like "TechFlow", "DataSync", "HealthHub" are automatic failures. DO NOT use overused suffixes like "-ify", "-ly", or "-io" unless the resulting word is shockingly clever. Compound words ARE allowed if they are unexpected or have a tight and meaningful metaphorical connection to the keyword (e.g., "Snapchat", "DoorDash" — these work because the pairing is witty).
3. **PRONOUNCEABILITY**: Any native English speaker should be able to read and say the name on first attempt, with no ambiguity. Avoid awkward consonant clusters (e.g., "Xr", "Zq").
4. **NO 90s PORTMANTEAUS**: Avoid names that sound like dated software companies (e.g., "Compuglobal", "Synernet").

### THE FRAMEWORK YOU MUST EXECUTE:

1. **FUNCTIONAL JOB OF THE NAME**:
   - The name must dominate a specific part of the industry conversation.
   - It must communicate character through sound and appearance (Phonetic Symbolism), independent of dictionary definition.
   - It must *feel right* for the keyword's domain even if the word is invented.

2. **TAXONOMY OF CONSTRUCTS (Select based on 'Style' input)**:
   - **Descriptive**: Functional, clear (e.g., "3 Day Blinds"). *risk: low distinctiveness.* Use sparingly.
   - **Suggestive**: Alludes to benefits (e.g., "Slack", "Pinterest").
   - **Abstract/Arbitrary**: Real words, no literal connection (e.g., "Apple", "Stripe"). Highly encouraged for modern brands.
   - **Fanciful/Coined**: Invented words for maximum trademarkability (e.g., "Kodak", "Zuora").
   - **Experiential**: Maps to user experience (e.g., "Gateway", "Safari").
   - **Evocative**: Signals brand spirit/archetype (e.g., "Virgin", "Nike").

3. **PHONETIC ENGINEERING (Apply based on 'Vibe')**:
   - **Front Vowels (i, e)**: Small, fast, light, precision, feminine. (Good for: Tech, Speed, Minimal)
   - **Back Vowels (o, u)**: Large, heavy, warm, authoritative, masculine. (Good for: Finance, Construction, Trust)
   - **Plosives (p, k, t, b, d, g)**: Powerful, memorable, hard.
   - **Fricatives (f, s, v, z)**: Soft, fast, modern.

4. **BRAND ARCHETYPES (Infer from 'Vibe' & 'Industry')**:
   - *The Sage* (Truth, expertise) -> Clear, insightful names.
   - *The Hero* (Strength) -> Bold, disciplined names.
   - *The Creator* (Innovation) -> Imaginative, non-linear names.
   - *The Outlaw* (Disruption) -> Provocative, edgy names.
   - *The Caregiver* (Nurturing) -> Warm, empathetic names.

### SCORING RUBRIC (be incredibly strict — most names score 50-70, only truly exceptional names score 85+):
- **90-100**: Brilliant. Would make a top-tier naming agency proud. Distinctive, highly memorable, deep keyword resonance, commercially viable.
- **80-89**: Great, solid name with clear rationale. Ready to present to a client.
- **60-79**: Mediocre. Generic, weak connection, or overused tropes. Cut these.
- **0-59**: Failure. Reject these completely.

### OUTPUT RULES:
- **Do NOT** output names scoring below 80. Only include names that genuinely pass the high-quality gates.
- **Do NOT** use boring generic AI names (e.g., "TechSolutions", "HealthHub", "DataFlow").
- **DO** use highly creative metaphors, historical/mythological subtext, and rhythmic invented words — but they MUST connect to the keyword.
- **DO** check for "Linguistic Disaster" (e.g., avoid accidental offensive meanings in major languages).
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
Generate 15-20 high-quality brand names. ONLY include names scoring 70 or above.
For each name, identify which Naming Construct it falls into.

Return ONLY valid JSON, no other text:
{
  "names": [
    { "name": "Name1", "style": "coined", "score": 88, "rationale": "Combines the 'flow' phoneme with -vex suffix suggesting velocity; coined, distinctive, trademarkable." },
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
