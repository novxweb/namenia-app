import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// --- IMPORT DIRECTLY FROM APP TO ENSURE 1:1 PARITY ---
import { INDUSTRIES, STYLES } from '../core/constants';
import { generateNamesWithAI } from '../core/services/ai-generator';

// --- CONFIGURATION ---
const MAX_CHECKS = 7000;
const OUTPUT_FILE = path.join(__dirname, '..', 'domain_catalog.json');
const EDGE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1` 
  : 'https://prtaykimbobfhjofrist.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

// Filter out the 'Select industry' placeholder
const VALID_INDUSTRIES = INDUSTRIES.filter(i => i !== 'Select industry');

// --- STATE ---
interface CatalogState {
    totalChecksMade: number;
    catalog: Record<string, any[]>;
    completedCombinations: string[]; 
}

let state: CatalogState = {
    totalChecksMade: 0,
    catalog: {},
    completedCombinations: []
};


// --- HELPER FUNCTIONS ---
function loadState() {
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const data = fs.readFileSync(OUTPUT_FILE, 'utf-8');
            state = JSON.parse(data);
            console.log(`[STATE] Resuming from existing catalog. Checks made previously: ${state.totalChecksMade}`);
        } catch (e) {
            console.error('[STATE] Error reading existing catalog, starting fresh.');
        }
    } else {
        console.log('[STATE] No existing catalog found, starting fresh.');
    }
}

function saveState() {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(state, null, 2));
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- AVAILABILITY CHECKER (Kept local to avoid React Native Supabase dependencies) ---
async function checkAvailability(names: string[]): Promise<any[]> {
    if (names.length === 0) return [];

    let availableNames: any[] = [];

    for (const name of names) {
        if (state.totalChecksMade >= MAX_CHECKS) {
             console.log(`\n[LIMIT] Reached hard limit of ${MAX_CHECKS} domain checks.`);
             return availableNames;
        }

        try {
            const safeName = name.replace(/[^a-zA-Z0-9-]/g, '');
            const response = await fetch(`${EDGE_FUNCTION_URL}/check-availability`, {
                 method: 'POST',
                 headers: {
                     "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                     "Content-Type": "application/json"
                 },
                 body: JSON.stringify({
                      name: safeName,
                      tlds: ['com']
                 })
            });

            state.totalChecksMade++;

            if (response.ok) {
                 const data = await response.json();
                 const comResult = (data.domains || []).find((d: any) => d.tld === 'com');
                 
                 if (comResult && comResult.available) {
                      availableNames.push({ name: safeName, tlds: ['com'] });
                 }
            } else {
                 console.error(`[AVAILABILITY ERROR] ${safeName}: HTTP ${response.status}`);
            }

            process.stdout.write(`\r[CHECKS: ${state.totalChecksMade} / ${MAX_CHECKS}] Checking: ${safeName}        `);
            await sleep(300);

        } catch (e) {
             console.error(`[AVAILABILITY ERROR] checking ${name}:`, e);
        }
    }
    console.log(); 
    return availableNames;
}

// --- MAIN LOOP ---
async function main() {
    console.log(`=== STARTING BATCH GENERATION ===`);
    
    if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE' && !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
         console.error('ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in the environment.');
         process.exit(1);
    }

    loadState();

    if (state.totalChecksMade >= MAX_CHECKS) {
         console.log(`Already at or over max checks (${state.totalChecksMade}). Exiting.`);
         return;
    }

    for (const industry of VALID_INDUSTRIES) {
        if (!state.catalog[industry]) {
            state.catalog[industry] = [];
        }

        // STYLES is an array of objects { label, value }
        for (const styleObj of STYLES) {
             const styleValue = styleObj.value;
             if (state.totalChecksMade >= MAX_CHECKS) break;

             const comboKey = `${industry}|${styleValue}`;
             if (state.completedCombinations.includes(comboKey)) continue;

             console.log(`\n--- Processing: ${industry} | Style: ${styleValue} ---`);
             
             try {
                 // EXACT APP PARITY: Use the AI Generator function from the app directly
                 console.log(`Generating AI names (using identical app service)...`);
                 const generatedObjects = await generateNamesWithAI({
                     keyword: industry.split(' ')[0] + ' startup', // Use an intelligent base keyword
                     style: styleValue as any,
                     randomness: 'medium', // standard generator randomness
                     industry: industry,
                     description: 'Modern, professional, available domains',
                     availabilityFocus: true // crucial for .com success
                 });

                 // Extract just the string names from the Returned objects
                 const generatedNames = generatedObjects.map(obj => obj.name);
                 console.log(`Generated ${generatedNames.length} names.`);

                 if (generatedNames.length > 0) {
                     const available = await checkAvailability(generatedNames);
                     const entries = available.map(a => ({ ...a, style: styleValue }));
                     state.catalog[industry] = [...state.catalog[industry], ...entries];
                     console.log(`Found ${available.length} available .com domains for ${industry} (${styleValue}).`);
                 }

                 state.completedCombinations.push(comboKey);
                 saveState();
                 await sleep(1000);

             } catch (e) {
                 console.error(`[ERROR] Processing failed for ${comboKey}:`, e);
             }
        }
        if (state.totalChecksMade >= MAX_CHECKS) break;
    }

    console.log(`\n=== PROCESS COMPLETE or LIMIT REACHED ===`);
    console.log(`Total Checks Made: ${state.totalChecksMade}`);
    console.log(`Results saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
