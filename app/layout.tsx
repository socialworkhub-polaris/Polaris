import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: 'Polaris | Triage & Trägerportal für Berliner Sozialarbeit',
  description:
    'Spezialisierte Triage- und Kooperationsplattform für Berliner Sozialarbeiter*innen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}