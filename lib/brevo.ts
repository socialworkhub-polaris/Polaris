import { render } from '@react-email/render';
import React from 'react';

const BREVO_API_URL = 'https://api.brevo.com/v3';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  react: React.ReactElement;
  replyTo?: { email: string; name?: string };
  senderEmail?: string;
  senderName?: string;
}

/**
 * Send a transactional email rendered via React Email through Brevo (Frankfurt/EU).
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  senderEmail: customSenderEmail,
  senderName: customSenderName,
}: SendEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = customSenderEmail || process.env.BREVO_SENDER_EMAIL || 'news@socialworkhub.net';
  const senderName = customSenderName || process.env.BREVO_SENDER_NAME || 'Socialworkhub';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured in environment variables.');
  }

  const htmlContent = await render(react);

  const payload: Record<string, unknown> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to,
    subject,
    htmlContent,
  };

  if (replyTo) {
    payload.replyTo = replyTo;
  }

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Brevo API Error:', data);
    throw new Error(data.message || `Brevo API request failed with status ${response.status}`);
  }

  return data as { messageId: string };
}

/**
 * Add or update a contact in Brevo newsletter list.
 */
export async function subscribeContact({
  email,
  attributes,
  listIds,
}: {
  email: string;
  attributes?: Record<string, string | number | boolean>;
  listIds?: number[];
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const defaultListId = Number(process.env.BREVO_NEWSLETTER_LIST_ID) || 2;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured in environment variables.');
  }

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      attributes: attributes || {},
      listIds: listIds || [defaultListId],
      updateEnabled: true,
    }),
  });

  const data = await response.json().catch(() => ({}));

  // Status 201 = Created, 204 = Updated
  if (!response.ok && response.status !== 204) {
    // If contact already exists and updateEnabled handled it, status code is sometimes returned with duplicate parameter
    if (data.code === 'duplicate_parameter') {
      return { success: true, message: 'Already subscribed' };
    }
    console.error('Brevo Subscribe Error:', data);
    throw new Error(data.message || `Failed to subscribe contact: ${response.status}`);
  }

  return { success: true, data };
}
