// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.info('generate-names edge function started');

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!OPENROUTER_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'OPENROUTER_API_KEY not configured. Add it in Supabase Dashboard → Edge Functions → Secrets.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();
        const { messages, temperature, model } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Forward to OpenRouter
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || 'meta-llama/llama-3-70b-instruct',
                messages,
                temperature: temperature || 0.7,
                response_format: { type: 'json_object' },
            }),
        });

        if (!openRouterResponse.ok) {
            const errorText = await openRouterResponse.text();
            console.error('OpenRouter error:', openRouterResponse.status, errorText);
            return new Response(
                JSON.stringify({
                    error: 'AI provider error',
                    status: openRouterResponse.status,
                    detail: errorText
                }),
                { status: openRouterResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = await openRouterResponse.json();

        return new Response(
            JSON.stringify(data),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
