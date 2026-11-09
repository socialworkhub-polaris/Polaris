import { NextResponse } from 'next/server';
import { TriageResponse } from '@/types/triage';
import { checkRateLimit } from '@/lib/rateLimit';

const LANGUAGE_NAMES: Record<string, string> = {
  uk: 'Ukrainian (Українська)',
  en: 'English',
  pl: 'Polish (Polski)',
  ar: 'Arabic (العربية)',
  ru: 'Russian (Русский)',
  de: 'German (Deutsch)',
};

export async function POST(req: Request) {
  // Rate limit: max 25 translations per 10 minutes per IP
  const rateLimit = checkRateLimit(req, 25, 600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Zu viele Übersetzungsanfragen. Bitte in ${rateLimit.resetInSec} Sekunden erneut versuchen.` },
      { status: 429 }
    );
  }

  try {
    const { triageResponse, targetLanguage } = await req.json();

    if (!triageResponse || !targetLanguage) {
      return NextResponse.json({ error: 'Ungültige Übersetzungsanfrage' }, { status: 400 });
    }

    if (targetLanguage === 'de') {
      return NextResponse.json({ translated: triageResponse });
    }

    const langLabel = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
    const apiKey = process.env.AI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || 'https://api.deepseek.com';
    const model = process.env.AI_MODEL || 'deepseek-chat';

    if (!apiKey || apiKey.includes('hier-deinen-echten')) {
      return NextResponse.json({ error: 'KI-Übersetzung nicht konfiguriert.' }, { status: 500 });
    }

    const prompt = `
You are a professional social work translator in Berlin. Translate this client emergency action plan into ${langLabel}.
Keep agency names (e.g. "Jugendamt", "Jobcenter", "Notübernachtung", "Krisendienst"), German statutory laws (e.g. "§ 8a SGB VIII"), addresses, and phone numbers EXACTLY as they are.
Translate the summary, titles, actions, and document checklist items so that a non-German speaking client can easily understand and follow them.

INPUT JSON:
${JSON.stringify({
  summary: triageResponse.summary,
  legalContext: triageResponse.legalContext,
  steps: triageResponse.steps.map((s: any) => ({
    phase: s.phase,
    title: s.title,
    action: s.action,
    requiredDocs: s.requiredDocs,
  })),
})}

OUTPUT ONLY VALID JSON with the exact same structure:
{
  "summary": "Translated summary",
  "legalContext": ["Preserve original statutory paragraphs"],
  "steps": [
    {
      "phase": "sofort",
      "title": "Translated title",
      "action": "Translated action",
      "requiredDocs": ["Translated document items"]
    }
  ]
}
`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a professional translator. Respond exclusively in valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Übersetzungsfehler: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Merge translated text with original matched facilities
    const mergedSteps = (triageResponse.steps || []).map((origStep: any, idx: number) => {
      const trStep = parsed.steps?.[idx] || {};
      return {
        ...origStep,
        title: trStep.title || origStep.title,
        action: trStep.action || origStep.action,
        requiredDocs: trStep.requiredDocs || origStep.requiredDocs,
      };
    });

    const translatedResult: TriageResponse = {
      summary: parsed.summary || triageResponse.summary,
      legalContext: triageResponse.legalContext,
      steps: mergedSteps,
    };

    return NextResponse.json({ translated: translatedResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Übersetzungsfehler' }, { status: 500 });
  }
}
