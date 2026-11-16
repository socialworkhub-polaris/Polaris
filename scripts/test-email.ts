import React from 'react';
import { sendEmail } from '../lib/brevo';
import { WelcomeEmail } from '../components/emails/WelcomeEmail';

async function main() {
  const targetEmail = process.argv[2] || 'mbreith@proton.me';
  console.log(`Sending test email to ${targetEmail} via Brevo...`);

  try {
    const result = await sendEmail({
      to: [{ email: targetEmail, name: 'Max' }],
      subject: 'Test: Willkommen bei Social Work Hub',
      react: React.createElement(WelcomeEmail, {
        name: 'Max',
        loginUrl: 'https://socialworkhub.net',
      }),
    });

    console.log('✅ Email successfully sent!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

main();
