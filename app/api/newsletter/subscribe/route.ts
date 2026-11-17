import { NextRequest, NextResponse } from 'next/server';
import { subscribeContact } from '@/lib/brevo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
        { status: 400 }
      );
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const customAttributes = typeof body.attributes === 'object' && body.attributes !== null ? body.attributes : {};

    const attributes: Record<string, string | number | boolean> = {
      ...customAttributes,
    };
    if (name) {
      attributes.FIRSTNAME = name;
      attributes.VORNAME = name;
    }

    const result = await subscribeContact({ email, attributes });

    return NextResponse.json({
      success: true,
      message: 'Erfolgreich für den Newsletter eingetragen!',
      result,
    });
  } catch (error: any) {
    console.error('Newsletter Subscribe Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Interner Serverfehler bei der Anmeldung.' },
      { status: 500 }
    );
  }
}
