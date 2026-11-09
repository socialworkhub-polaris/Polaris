import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import PWARegister from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'Polaris | Triage & Trägerportal für Berliner Sozialarbeit',
  description:
    'Spezialisierte Triage- und Kooperationsplattform für Berliner Sozialarbeiter*innen (Offline-fähig für Streetwork)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Polaris',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <PWARegister />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}