import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/brevo';
import { TeamInviteEmail } from '@/components/emails/TeamInviteEmail';
import React from 'react';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Bitte melden Sie sich an.' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Ungültige Sitzung.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { organizationId, email, recipientName } = body;

    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Keine Organisation angegeben.' },
        { status: 400 }
      );
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Verify sender membership in organization
    const { data: senderMembership, error: memberErr } = await userClient
      .from('organization_members')
      .select('role, user_name, organization:organizations(id, name, invite_code)')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single();

    if (memberErr || !senderMembership) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Sie sind kein Mitglied dieses Teams.' },
        { status: 403 }
      );
    }

    const org = senderMembership.organization as any;
    if (!org?.invite_code) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Team-Code nicht gefunden.' },
        { status: 404 }
      );
    }

    // Check if recipient is already in this team
    const { data: existingMember } = await userClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_email', targetEmail)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: 'ALREADY_MEMBER', message: 'Diese Person ist bereits Mitglied des Teams.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'polaris.socialworkhub.net';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const joinUrl = `${protocol}://${host}/?join=${org.invite_code}`;

    const inviterName = senderMembership.user_name || userData.user.user_metadata?.full_name || 'Ihre Kollegin / Ihr Kollege';

    // Send invitation via Brevo
    await sendEmail({
      to: [{ email: targetEmail, name: recipientName || undefined }],
      subject: `Einladung zum Polaris-Team: ${org.name}`,
      senderEmail: 'polaris@socialworkhub.net',
      senderName: 'Polaris | Social Work Hub',
      react: React.createElement(TeamInviteEmail, {
        inviterName,
        teamName: org.name,
        joinCode: org.invite_code,
        joinUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Einladung an ${targetEmail} wurde erfolgreich versendet!`,
    });
  } catch (error: any) {
    console.error('Team Invite Route Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error?.message || 'Fehler beim Versenden der Einladung.' },
      { status: 500 }
    );
  }
}
