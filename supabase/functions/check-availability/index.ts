// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DOMAINR_API_KEY = Deno.env.get('DOMAINR_API_KEY');
if (!DOMAINR_API_KEY) {
    console.error("Missing DOMAINR_API_KEY");
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.info('check-availability edge function started');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { name, tlds } = await req.json();

        if (!name) {
            return new Response(
                JSON.stringify({ error: 'name is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const results: any = {
            domains: [],
            // socials: removed
            // trademark: removed
        };

        // ── Domain checks via Domainr API (server-side, no CORS issues) ──
        if (tlds && tlds.length > 0) {
            const domainChecks = tlds.map(async (tld: string) => {
                const cleanTld = tld.replace('.', '');
                const domain = `${name.toLowerCase()}.${cleanTld}`;
                try {
                    // Start with Fastly Domain Research API (New)
                    // Docs: https://www.fastly.com/documentation/reference/api/domain-management/domain-research/
                    // User Example: params 'domain' and 'scope=estimate' (or default)
                    const resp = await fetch(
                        `https://api.fastly.com/domain-management/v1/tools/status?domain=${domain}`,
                        {
                            headers: {
                                'Fastly-Key': DOMAINR_API_KEY,
                                'Accept': 'application/json'
                            }
                        }
                    );

                    if (resp.ok) {
                        const data = await resp.json();
                        // Fastly response format (Single Object): { "domain": "example.com", "status": "undelegated inactive", ... }
                        // We check the root object directly.
                        const status = data?.status || '';

                        const apiSaysAvailable = status.includes('undelegated') || status.includes('inactive');

                        // If API says taken, trust it.
                        if (!apiSaysAvailable) {
                            console.log(`[TAKEN] ${domain} (Source: API Status '${status}')`);
                            return { tld: cleanTld, available: false, source: 'api' };
                        }

                        // If API says available, VERIFY with DNS to catch Parked/Premium domains.
                        // Real available domains have NO NS records.
                        try {
                            const records = await Deno.resolveDns(domain, "NS");
                            console.log(`[TAKEN] ${domain} (Source: DNS Records Found: ${records.length})`);
                            // Found NS records -> Likely Parked or Premium -> TAKEN
                            return { tld: cleanTld, available: false, source: 'dns_verification' };
                        } catch (dnsError) {
                            if (dnsError instanceof Deno.errors.NotFound) {
                                console.log(`[AVAILABLE] ${domain} (Source: DNS NotFound)`);
                                // No NS records -> Truly Available
                                return { tld: cleanTld, available: true, source: 'verified' };
                            }
                            console.log(`[TAKEN] ${domain} (Source: DNS Error '${dnsError}')`);
                            // Other DNS error -> Assume taken for safety
                            return { tld: cleanTld, available: false, source: 'dns_error' };
                        }
                    } else {
                        console.error(`Fastly API Error param: ${resp.status} ${resp.statusText}`);
                    }
                } catch (e) {
                    console.error(`Domain check failed for ${domain}:`, e);
                }

                // Fallback for API failure: Strict DNS Check
                try {
                    await Deno.resolveDns(domain, "NS");
                    return { tld: cleanTld, available: false, source: 'dns_fallback' };
                } catch (dnsError) {
                    if (dnsError instanceof Deno.errors.NotFound) {
                        return { tld: cleanTld, available: false, source: 'dns_strict_fallback' };
                    }
                    return { tld: cleanTld, available: false, source: 'dns_error_fallback' };
                }
            });

            results.domains = await Promise.all(domainChecks);
        }



        return new Response(
            JSON.stringify(results),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Availability check error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
