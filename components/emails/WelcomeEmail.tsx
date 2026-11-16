import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name?: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  name = 'Kollegin / Kollege',
  loginUrl = 'https://socialworkhub.net',
}: WelcomeEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Willkommen bei Social Work Hub – Ihrer Plattform für Soziale Arbeit</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header / Logo */}
          <Section style={headerSection}>
            <Heading style={logoText}>Social Work Hub</Heading>
            <Text style={subHeader}>Plattform für Soziale Arbeit & Fachkräfte</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              Herzlich willkommen, {name}!
            </Heading>
            <Text style={paragraph}>
              Wir freuen uns sehr, Sie bei <strong>Social Work Hub</strong> begrüßen zu dürfen. 
              Unsere Plattform vernetzt Fachkräfte, Träger und Initiativen der Sozialen Arbeit in Deutschland.
            </Text>

            <Text style={paragraph}>
              Sie haben ab sofort Zugriff auf aktuelle Fachinhalte, Beratungsnetzwerke und unsere interaktive Kartierung.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Jetzt direkt starten →
              </Button>
            </Section>

            <Text style={noteText}>
              Falls der Button nicht funktioniert, kopieren Sie bitte folgenden Link in Ihren Browser:{' '}
              <Link href={loginUrl} style={link}>
                {loginUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Legal German Footer (DSGVO & TMG Konformität) */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>Social Work Hub</strong> • Deutschland
              <br />
              Kontakt: <Link href="mailto:news@socialworkhub.net" style={footerLink}>news@socialworkhub.net</Link>
            </Text>
            <Text style={footerDisclaimer}>
              Sie erhalten diese E-Mail, da Sie sich bei Social Work Hub registriert haben.
              Verarbeitung erfolgt DSGVO-konform auf EU-Servern.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

// --- Styles ---
const main = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: '0',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
};

const headerSection = {
  backgroundColor: '#1e293b',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0 0 4px 0',
};

const subHeader = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '0',
};

const contentSection = {
  padding: '32px 32px 24px 32px',
};

const greeting = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#334155',
  margin: '0 0 16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 28px',
};

const noteText = {
  fontSize: '12px',
  color: '#64748b',
  lineHeight: '1.5',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0 32px',
};

const footer = {
  padding: '24px 32px 32px 32px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const footerDisclaimer = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.4',
};
