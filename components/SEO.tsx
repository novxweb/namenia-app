import Head from 'expo-router/head';

export const SEO = ({ title, description }: { title: string; description: string }) => (
    <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
    </Head>
);
