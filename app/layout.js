import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import { TrackerProvider } from '@/hooks/useTracker';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'VUKA Lite - The South African Strava Light',
  description: 'Press Start. Run. Done. No subscription. Connect any SA watch, track offline, keep your data.',
  manifest: '/manifest.json',
  applicationName: 'VUKA Lite',
  appleWebApp: { capable: true, title: 'VUKA Lite', statusBarStyle: 'black-translucent' },
  icons: { icon: '/favicon.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-ZA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@800&display=swap"
        />
      </head>
      <body>
        <AppProvider>
          <TrackerProvider>
            <Shell>{children}</Shell>
          </TrackerProvider>
        </AppProvider>
      </body>
    </html>
  );
}
