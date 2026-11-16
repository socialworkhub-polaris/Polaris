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

interface TeamInviteEmailProps {
  inviterName?: string;
  teamName: string;
  joinCode: string;
  joinUrl: string;
}

export function TeamInviteEmail({
  inviterName = 'Ein Teammitglied',
  teamName = 'Ihr Sozialarbeit-Team',
  joinCode = 'ABC123',
  joinUrl = 'https://polaris.socialworkhub.net',
}: TeamInviteEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Einladung zum Polaris-Team: {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logoText}>Polaris</Heading>
            <Text style={subHeader}>Sozialarbeiter-Kompass Berlin • Social Work Hub</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              Sie wurden zu einem Team eingeladen!
            </Heading>
            
            <Text style={paragraph}>
              Hallo,
            </Text>
            
            <Text style={paragraph}>
              <strong>{inviterName}</strong> hat Sie eingeladen, dem Polaris-Team <strong>{teamName}</strong> beizutreten.
            </Text>

            <Text style={paragraph}>
              Mit Polaris arbeiten Sie gemeinsam im Team an der Berliner Sozialleistungs- und Einrichtungs-Navigation:
            </Text>

            <Section style={featureBox}>
              <Text style={featureItem}>📌 <strong>Gemeinsames Schwarzes Brett:</strong> Schnelle Schichtübergabe und teaminterne Hinweise.</Text>
              <Text style={featureItem}>🏢 <strong>Einrichtungs-Notizen:</strong> Eigene Erfahrungswerte & Ansprechpartner zu Berliner Trägern festhalten.</Text>
              <Text style={featureItem}>🧭 <strong>Socio-Legal Triage:</strong> Rechtssichere Stufenpläne (SGB II, VIII, XII & ASOG) erstellen.</Text>
              <Text style={featureItem}>🔒 <strong>100% DSGVO & § 35 SGB I:</strong> Hosting in der EU, keine permanente Speicherung von Klienten-PII.</Text>
            </Section>

            {/* Code Highlight Box */}
            <Section style={codeBox}>
              <Text style={codeLabel}>Ihr 6-stelliger Team-Code:</Text>
              <Text style={codeValue}>{joinCode}</Text>
            </Section>

            {/* Join CTA */}
            <Section style={buttonContainer}>
              <Button style={button} href={joinUrl}>
                Team jetzt beitreten →
              </Button>
            </Section>

            <Text style={noteText}>
              Falls der Button nicht funktioniert, öffnen Sie einfach folgenden Link im Browser:{' '}
              <Link href={joinUrl} style={link}>
                {joinUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Hr style={divider} />
            <Text style={footerText}>
              Diese Einladung wurde von {inviterName} über <strong>Polaris</strong> versendet. 
              Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail einfach ignorieren.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Social Work Hub • Berlin, Deutschland
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/* Styles */
const main: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0 auto',
  padding: '24px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e4e4e7',
  maxWidth: '580px',
  margin: '0 auto',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const headerSection: React.CSSProperties = {
  backgroundColor: '#090d16',
  padding: '28px 32px',
  textAlign: 'center',
};

const logoText: React.CSSProperties = {
  color: '#38bdf8',
  fontSize: '24px',
  fontWeight: '800',
  letterSpacing: '-0.5px',
  margin: '0',
};

const subHeader: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '13px',
  marginTop: '6px',
  marginBottom: '0',
};

const contentSection: React.CSSProperties = {
  padding: '32px',
};

const greeting: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 16px 0',
};

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#334155',
  margin: '0 0 16px 0',
};

const featureBox: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const featureItem: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#334155',
  margin: '6px 0',
};

const codeBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px dashed #22c55e',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  margin: '24px 0 20px 0',
};

const codeLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#15803d',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const codeValue: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '4px',
  color: '#166534',
  margin: '0',
  fontFamily: 'monospace',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0 24px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 28px',
  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
};

const noteText: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#64748b',
  margin: '16px 0 0 0',
  wordBreak: 'break-all',
};

const link: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const divider: React.CSSProperties = {
  borderColor: '#f1f5f9',
  margin: '24px 0 16px 0',
};

const footerSection: React.CSSProperties = {
  padding: '0 32px 24px 32px',
  backgroundColor: '#ffffff',
};

const footerText: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: '6px 0',
  textAlign: 'center',
};
