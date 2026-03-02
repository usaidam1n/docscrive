import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { cn } from './theme-config';
import { ThemeProvider } from '../app/components/ThemeProvider';
import { GitHubAuthProvider } from '../app/components/providers/GitHubAuthProvider';
import { SettingsProvider } from '../app/components/providers/SettingsProvider';
import GlobalSettingsModal from '../app/components/GlobalSettingsModal';
import { UmamiScript } from '../components/UmamiScript';
import { JsonLd } from '../components/SEO/JsonLd';
import { generateMetadata, schemaTemplates } from '../lib/seo';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-crimson',
  preload: true,
});

export const metadata: Metadata = generateMetadata({
  title: 'DocScrive - AI-Powered Code Documentation & Translation Tools',
  description:
    'Transform your code into comprehensive documentation instantly with AI. Generate docs from GitHub repos, translate code between languages, and automate documentation workflows. Free AI-powered developer tools.',
  canonical: 'https://docscrive.com',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://api.docscrive.com" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#2B5797" />

        {/* Prevent zooming on mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body
        className={cn(
          'bg-background min-h-screen font-sans antialiased',
          inter.variable,
          crimsonPro.variable
        )}
      >
        {/* Organization and Software Application Schema */}
        <JsonLd data={schemaTemplates.organization} />
        <JsonLd data={schemaTemplates.softwareApplication} />

        <ThemeProvider>
          <SettingsProvider>
            <GitHubAuthProvider>
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
              <GlobalSettingsModal />
            </GitHubAuthProvider>
          </SettingsProvider>
        </ThemeProvider>
        <UmamiScript />
      </body>
    </html>
  );
}
