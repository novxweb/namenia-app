import { generateBrandNames, GeneratedName, NameStyle, RandomnessLevel } from './generator';

// Edge function URL — built from the Supabase project URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-names`;

const NAME_STRATEGY_SYSTEM_PROMPT = `
You are a World-Class Brand Naming Strategist, an expert in the "Strategic Architecture for Brand Nomenclature". Your goal is to generate high-value, protectable, and strategic brand names by "filling in the blanks" of a comprehensive naming brief based on limited user input.

### THE FRAMEWORK YOU MUST EXECUTE:

1.  **FUNCTIONAL JOB OF THE NAME**: 
    - The name must dominate a specific part of the industry conversation.
    - It must communicate character through sound and appearance (Phonetic Symbolism), independent of dictionary definition.

2.  **TAXONOMY OF CONSTRUCTS (Select based on 'Style' input)**:
    - **Descriptive**: Functional, clear (e.g., "3 Day Blinds"). *risk: low distinctiveness.*
    - **Suggestive**: Alludes to benefits (e.g., "Slack", "Pinterest").
    - **Abstract/Arbitrary**: Real words, no connection (e.g., "Apple", "Orange").
    - **Fanciful/Coined**: Invented words for maximum trademarkability (e.g., "Kodak").
    - **Experiential**: Maps to user experience (e.g., "Gateway", "Safari").
    - **Evocative**: Signals brand spirit/archetype (e.g., "Virgin", "Nike").

3.  **PHONETIC ENGINEERING (Apply based on 'Vibe')**:
    - **Front Vowels (i, e)**: Small, fast, light, precision, feminine. (Good for: Tech, Speed, Minimal)
    - **Back Vowels (o, u)**: Large, heavy, warm, authoritative, masculine. (Good for: Finance, Construction, Trust)
    - **Plosives (p, k, t, b, d, g)**: Powerful, memorable, hard.
    - **Fricatives (f, s, v, z)**: Soft, fast, modern.

4.  **BRAND ARCHETYPES (Infer from 'Vibe' & 'Industry')**:
    - *The Sage* (Truth, expertise) -> Clear, insightful names.
    - *The Hero* (Strength) -> Bold, disciplined names.
    - *The Creator* (Innovation) -> Imaginative, non-linear names.
    - *The Outlaw* (Disruption) -> Provocative, edgy names.
    - *The Caregiver* (Nurturing) -> Warm, empathetic names.

### YOUR TASK:

1.  **ANALYZE INPUTS**: You will receive Keyword, Vibe, Industry, Style, and Randomness.
2.  **INFER THE BRIEF**: Based on these, mentally construct the "Audience Cravings" (e.g., Safety vs. Adventure) and "Competitive Tone".
3.  **GENERATE NAMES**: Create 15-20 candidates that pass the **SMILE Test** (Suggestive, Memorable, Imagery, Legs, Emotional).
4.  **DIVERSITY**: Ensure a mix of "Safe" (Descriptive/Suggestive) and "Daring" (Abstract/Coined) names, unless the user strictly specified a style.
5.  **OUTPUT FORMAT**: JSON only.

### CRITICAL RULES:
- **Do NOT** use boring, generic AI names (e.g., "TechSolutions", "HealthHub").
- **DO** use interesting compound words, misspelling (like "Lyft"), and rhythmic invented words.
- **DO** check for "Linguistic Disaster" (e.g., avoid accidental offensive meanings in major languages).
- Score each name (0-100) based on its strategic strength (SMILE test + Trademarks potential).
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

    // Construct a specific user prompt that maps the simple inputs to the complex framework
    const userPrompt = `
    ACT AS THE STRATEGIST. Execute the Naming Brief with the following parameters:

    **SECTION I: PROJECT SCOPE**
    - **Core Keyword/Seed**: "${keyword}"
    - **Industry Context**: ${industry || 'General/Technology'}
    - **Target Market**: ${country || 'Global'}

    **SECTION II: STRATEGIC PARAMETERS (Inferred)**
    - **Target Vibe/Archetype**: ${description || 'Modern & Professional'}
    - **Requested Style Taxonomy**: ${style === 'auto' ? 'Mixed Strategy (Explore 2-3 distinct buckets)' : style}
    - **Creativity/Risk Level**: ${randomness} (Low = Safer/Descriptive, High = Abstract/Coined/Experimental)

    ${availabilityFocus ? `
    **CRITICAL PRIORITY - MAXIMIZE AVAILABILITY**:
    The user is finding that most .com domains are taken. You MUST generate names that are highly likely to be available.
    
    STRATEGIES FOR AVAILABILITY:
    1. **Compound Neologisms**: Combine 2 distinct concepts (e.g. "Velocivault", "Luminaflow").
    2. **Unique Suffixes**: Use less common endings: -io, -ia, -ex, -or, -ax, -ix, -zen.
    3. **Rhythmic Coinage**: Completely invented words with good cadence (e.g. "Kavara", "Zylos").
    4. **Avoid Dictionary Words**: Do NOT use single real words. They are 100% taken.
    5. **Abstract Associations**: Focus on the *feeling* rather than the literal meaning.
    ` : ''}

    **INSTRUCTION:**
    Generate 15-20 high-quality brand names. 
    For each name, explicitly identify which **Naming Construct** it falls into (e.g., "Coined", "Evocative", "Compound").
    
    Return JSON format:
    {
      "names": [
        { "name": "Name1", "style": "coined", "score": 95, "rationale": "Short, plosive, high recall." },
        ...
      ]
    }
    `;

    try {
        // Call the Supabase Edge Function instead of OpenRouter directly
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

        // Parse JSON
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse AI response", content);
            return [];
        }

        if (parsed && Array.isArray(parsed.names)) {
            return parsed.names.map((n: any) => ({
                name: n.name,
                tld: '.com',
                style: mapAiStyleToLocal(n.style),
                score: n.score || 85,
                rationale: n.rationale // We might use this in the UI later if we update the Card
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
