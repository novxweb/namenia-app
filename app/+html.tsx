import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                {/* Base URL for subpath deployment */}
                <base href="/app/" />
                <title>Namenia - AI Business Name Generator</title>
                <meta name="description" content="Generate unique, brandable business names in seconds with Namenia. Our AI-powered tool checks domain and social handle availability instantly." />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://namenia.com/app" />
                <meta property="og:title" content="Namenia App - Generate Business Names" />
                <meta property="og:description" content="Use Namenia's powerful AI to discover and shortlist the perfect name for your business." />
                <meta property="og:image" content="/og-image.png" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://namenia.com/app" />
                <meta property="twitter:title" content="Namenia App - Generate Business Names" />
                <meta property="twitter:description" content="Use Namenia's powerful AI to discover and shortlist the perfect name for your business." />
                <meta property="twitter:image" content="/og-image.png" />

                {/* PWA Manifest and Icons */}
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
                <link rel="apple-touch-icon" href="/icon-192.png" />

                {/* Google Analytics (GA4) - Static Injection for Expo Web */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-N24Q4YYRXZ"></script>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N24Q4YYRXZ', { 'send_page_view': false });
            `,
                    }}
                />

                {/* Ahrefs Analytics */}
                <script src="https://analytics.ahrefs.com/analytics.js" data-key="iuzp5EmHCTfjadxN4dO/ow" async></script>

                <ScrollViewStyleReset />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
