'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Shield,
  Download,
  Share2,
} from 'lucide-react';
import { TriageResponse, TriageInput } from '@/types/triage';
import { useAuth } from '@/lib/AuthContext';
import { useTeam } from '@/lib/TeamContext';
import { QRCodeCard } from './QRCodeCard';
import { getTransitDirectionsUrl } from '@/lib/geolocation';

interface TriageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TriageResponse;
  formData: TriageInput;
  selectedLang?: string;
}

export function TriageExportModal({
  isOpen,
  onClose,
  result,
  formData,
  selectedLang = 'de',
}: TriageExportModalProps) {
  const { user } = useAuth();
  const { currentOrganization } = useTeam();

  const [exportMode, setExportMode] = useState<'aktenvermerk' | 'klient'>('aktenvermerk');
  const [caseId, setCaseId] = useState<string>(() => `FALL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [caseworkerName, setCaseworkerName] = useState<string>(() => user?.user_metadata?.full_name || 'Fachkraft Soziale Arbeit');
  const [agencyName, setAgencyName] = useState<string>(() => currentOrganization?.name || 'Freier Träger / Beratungsstelle Berlin');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const todayStr = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeStr = new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const housingLabels: Record<string, string> = {
    homeless: 'Akut obdachlos / Straße',
    rent_threatened: 'Zur Miete (Kündigung / Räumung droht)',
    parental_home: 'Im elterlichen Haushalt',
    sheltered: 'Notunterkunft / Wohnheim / Hostel',
    precarious: 'Prekäre Wohnsituation / Couchsurfing',
    institutional_exit: 'Entlassung aus Institution (Klinik / JVA)',
  };

  const urgencyLabels: Record<string, string> = {
    acute: 'Akut / Sofortintervention erforderlich',
    high: 'Hoch / Binnen 24-48 Stunden',
    medium: 'Mittel / Reguläre Frist',
    low: 'Niedrig / Beratungsbedarf',
  };

  const residenceLabels: Record<string, string> = {
    german: 'Deutsche Staatsangehörigkeit',
    eu_citizen: 'EU-Freizügigkeit (§ 2 FreizügG/EU)',
    third_country: 'Drittstaatsangehörigkeit / Aufenthaltstitel',
    unclear: 'Aufenthaltsrechtlich ungeklärt',
  };

  const handlePrint = () => {
    window.print();
  };

  const escapeHtml = (str?: string | null): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const handleDownloadHtml = () => {
    let htmlContent = '';
    const title = exportMode === 'aktenvermerk' ? `Aktenvermerk_${caseId}` : `Klienten_Laufzettel_${todayStr.replace(/\./g, '-')}`;
    const safeAgency = escapeHtml(agencyName);
    const safeCaseId = escapeHtml(caseId);
    const safeWorker = escapeHtml(caseworkerName);
    const safeNotes = escapeHtml(formData.notes || 'Keine');

    if (exportMode === 'aktenvermerk') {
      htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Aktenvermerk ${safeCaseId} — Polaris</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.5; font-size: 13px; }
    h1 { font-size: 20px; font-weight: 900; margin: 0 0 4px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .section { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f8fafc; }
    .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin-bottom: 8px; }
    .step { border: 1px solid #e2e8f0; background: #fff; padding: 12px; border-radius: 6px; margin-bottom: 8px; }
    .signoff { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 16px; border-top: 2px solid #0f172a; }
    .line { border-bottom: 1px solid #94a3b8; height: 32px; width: 220px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">${safeAgency}</div>
    <h1>SOZIALPÄDAGOGISCHES ERSTCLEARING & AKTENVERMERK</h1>
    <div style="color: #475569;">Fall-ID: <strong>${safeCaseId}</strong> • Datum: ${todayStr}, ${timeStr} Uhr • Fachkraft: ${safeWorker}</div>
  </div>

  <div class="section">
    <div class="section-title">1. STAMMDATEN & FALLCHARAKTERISTIK</div>
    <p>• Wohnsituation: <strong>${housingLabels[formData.housingStatus] || formData.housingStatus}</strong></p>
    <p>• Dringlichkeit: <strong>${urgencyLabels[formData.urgency] || formData.urgency}</strong></p>
    <p>• Aufenthaltsstatus: ${residenceLabels[formData.residenceStatus] || formData.residenceStatus}</p>
    <p>• Bezirk: ${formData.district || 'Berlinweit'}</p>
    <p>• Aktenvermerk / Kontext: ${safeNotes}</p>
  </div>

  <div class="section">
    <div class="section-title">2. SOZIALRECHTLICHE EINSCHÄTZUNG & RECHTSGRUNDLAGEN</div>
    <p style="font-weight: 600; color: #1e3a8a;">${result.summary}</p>
    <p style="margin-top: 6px; font-size: 11px; color: #475569;">${(result.legalContext || []).join(' • ')}</p>
  </div>

  <div class="section">
    <div class="section-title">3. INTERVENTIONS- UND STUFENPLAN</div>
    ${result.steps.map((s, idx) => `
      <div class="step">
        <strong style="color: #1e40af;">Stufe ${idx + 1}: ${s.title}</strong>
        <p style="margin: 4px 0;">${s.action}</p>
        ${s.requiredDocs && s.requiredDocs.length ? `<p style="font-size: 11px; color: #475569;"><strong>Unterlagen:</strong> ${s.requiredDocs.join(', ')}</p>` : ''}
        ${s.matchedFacilities && s.matchedFacilities.length ? `<p style="font-size: 11px; color: #047857;"><strong>Anlaufstelle:</strong> ${s.matchedFacilities.map((f: any) => `${f.name} (${typeof f.address === 'string' ? f.address : f.address?.street || ''})`).join(', ')}</p>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="signoff">
    <div>
      <div class="line"></div>
      <div style="font-size: 10px; color: #64748b;">Datum & Handzeichen Fachkraft (${caseworkerName})</div>
    </div>
    <div>
      <div class="line"></div>
      <div style="font-size: 10px; color: #64748b;">Kenntnisnahme Leitung (${agencyName})</div>
    </div>
  </div>
</body>
</html>`;
    } else {
      htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Persönlicher Beratungs-Fahrplan</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.5; font-size: 14px; }
    h1 { font-size: 24px; font-weight: 900; margin: 0 0 4px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .step { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fff; }
    .step-num { display: inline-block; background: #2563eb; color: #fff; width: 24px; height: 24px; border-radius: 999px; text-align: center; line-height: 24px; font-weight: bold; margin-right: 8px; font-size: 12px; }
    .docs { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">POLARIS • Sozialarbeiter-Kompass Berlin</div>
    <h1>Persönlicher Fahrplan für Ihre Beratung</h1>
    <div style="color: #475569;">Datum: ${todayStr} • Bezirk: ${formData.district || 'Berlinweit'}</div>
  </div>

  ${result.steps.map((s, idx) => `
    <div class="step">
      <div><span class="step-num">${idx + 1}</span><strong>${s.title}</strong></div>
      <p style="margin: 8px 0 0 32px;">${s.action}</p>
      ${s.requiredDocs && s.requiredDocs.length ? `
        <div class="docs" style="margin-left: 32px;">
          <strong style="display:block; margin-bottom: 6px; font-size: 12px;">Bitte mitbringen (Checkliste):</strong>
          ${s.requiredDocs.map(d => `<div style="margin-bottom: 4px;">☐ ${d}</div>`).join('')}
        </div>
      ` : ''}
      ${s.matchedFacilities && s.matchedFacilities.length ? `
        <div style="margin-left: 32px; margin-top: 10px;">
          <strong style="font-size: 12px;">Hierhin können Sie sich wenden:</strong>
          ${s.matchedFacilities.map((f: any) => `
            <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-top: 4px; font-size: 12px;">
              <strong>${f.name}</strong><br>
              📍 ${typeof f.address === 'string' ? f.address : f.address?.street || ''}, ${typeof f.address === 'object' ? f.address?.zipCode || '' : ''} Berlin<br>
              ${f.contact?.phone ? `📞 Tel: ${f.contact.phone}` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <div style="margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
    Erstellt mit Polaris — Sozialarbeiter-Kompass Berlin
  </div>
</body>
</html>`;
    }

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    let text = '';
    if (exportMode === 'aktenvermerk') {
      text = `======================================================================
SOZIALPÄDAGOGISCHES ERSTCLEARING & TRIAGE-AKTENVERMERK
======================================================================
Träger / Dienst: ${agencyName}
Aktenzeichen / Fall-ID: ${caseId}
Datum / Zeit: ${todayStr}, ${timeStr} Uhr
Zuständiger Bezirk: ${formData.district || 'Berlinweit / Ungeklärt'}
Bearbeitende Fachkraft: ${caseworkerName}

1. STAMMDATEN & FALLCHARAKTERISTIK
----------------------------------------------------------------------
• Wohnsituation: ${housingLabels[formData.housingStatus] || formData.housingStatus}
• Dringlichkeitsstufe: ${urgencyLabels[formData.urgency] || formData.urgency}
• Aufenthaltsstatus: ${residenceLabels[formData.residenceStatus] || formData.residenceStatus}
• Besonderheiten: ${[
        formData.clientAge ? `Alter: ${formData.clientAge}` : null,
        formData.hasChildrenInHousehold ? 'Minderjährige im Haushalt' : null,
        formData.isPregnant ? 'Schwangerschaft gemeldet' : null,
        formData.isDomesticViolenceVictim ? 'Schutzbedarf häusliche Gewalt' : null,
        formData.hasDebtIssues ? 'Schuldenproblematik' : null,
        formData.needsSubstanceOrMentalSupport ? 'Suchthilfe / Seelische Gesundheit' : null,
      ].filter(Boolean).join('; ') || 'Keine akuten Zusatzfaktoren'}

2. GESETZLICHE GRUNDLAGEN & RECHTSKONTEXT
----------------------------------------------------------------------
${result.legalContext && result.legalContext.length > 0 ? result.legalContext.join('; ') : 'Allgemeine Beratungsstandards SGB / ASOG'}

3. SOZIALRECHTLICHE EINSCHÄTZUNG
----------------------------------------------------------------------
${result.summary}

4. STRUKTURIERTER INTERVENTIONS- UND STUFENPLAN
----------------------------------------------------------------------
`;
      result.steps.forEach((step, idx) => {
        text += `\n[STUFE ${idx + 1}: ${step.phase.toUpperCase()}] ${step.title}\n`;
        text += `Handlungsanweisung: ${step.action}\n`;
        if (step.requiredDocs && step.requiredDocs.length > 0) {
          text += `Erforderliche Unterlagen: ${step.requiredDocs.join(', ')}\n`;
        }
        if (step.matchedFacilities && step.matchedFacilities.length > 0) {
          text += `Zuständige Anlaufstelle(n):\n`;
          step.matchedFacilities.forEach((f: any) => {
            const addr = typeof f.address === 'string' ? f.address : f.address?.street || '';
            const tel = f.phone || f.contact?.phone || '-';
            text += `  • ${f.name} | ${addr} | Tel: ${tel}\n`;
          });
        }
      });

      text += `\n======================================================================
Erstberatung durchgeführt und Vermerk zu den Akten genommen.
Handzeichen / Datum: __________________________________
`;
    } else {
      text = `=== POLARIS HANDLUNGSPLAN FÜR KLIENT*INNEN ===
Datum: ${todayStr} | Bezirk: ${formData.district || 'Berlinweit'}

Wichtige Schritte für Sie:
`;
      result.steps.forEach((step, idx) => {
        text += `\nSchritt ${idx + 1}: ${step.title}\n`;
        text += `${step.action}\n`;
        if (step.requiredDocs && step.requiredDocs.length > 0) {
          text += `Bitte mitbringen:\n`;
          step.requiredDocs.forEach((doc) => {
            text += `  [ ] ${doc}\n`;
          });
        }
        if (step.matchedFacilities && step.matchedFacilities.length > 0) {
          text += `Wohin Sie gehen müssen:\n`;
          step.matchedFacilities.forEach((f: any) => {
            const addr = typeof f.address === 'string' ? f.address : f.address?.street || '';
            const tel = f.phone || f.contact?.phone || '-';
            text += `  • ${f.name}: ${addr} (Tel: ${tel})\n`;
          });
        }
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:block">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Top Control Bar (Screen only, hidden on print) */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Stufenplan-Export &amp; Aktenvermerk</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  DIN A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Behördenkonformer Aktenvermerk für Träger oder druckfertiger Klienten-Laufzettel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher & Meta Inputs Bar (Screen only) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 print:hidden space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setExportMode('aktenvermerk')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  exportMode === 'aktenvermerk'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Fachlicher Aktenvermerk (Akte / Träger)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportMode('klient')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  exportMode === 'klient'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Klienten-Laufzettel (Handout)</span>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="In Zwischenablage kopieren (z. B. für PROSOZ, OPEN oder Word)"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert!' : 'Text kopieren'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Als eigenständige HTML-Datei für Dokumentenablage speichern"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Datei speichern</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Drucken / PDF</span>
              </button>
            </div>
          </div>

          {/* Aktenvermerk Meta Inputs (only shown in aktenvermerk mode) */}
          {exportMode === 'aktenvermerk' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Aktenzeichen / Fall-ID:
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Träger / Einrichtung:
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Bearbeitende Fachkraft:
                </label>
                <input
                  type="text"
                  value={caseworkerName}
                  onChange={(e) => setCaseworkerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Document Scroll Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          
          {/* DIN A4 PAPER SHEET */}
          <div className="max-w-[760px] mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
            
            {/* ========================================================== */}
            {/* VIEW A: FACHLICHER AKTENVERMERK                            */}
            {/* ========================================================== */}
            {exportMode === 'aktenvermerk' && (
              <div className="space-y-6 text-xs leading-relaxed">
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                        {agencyName}
                      </div>
                      <h1 className="text-xl font-black text-slate-950 tracking-tight mt-0.5">
                        Sozialpädagogisches Erstclearing
                      </h1>
                      <div className="text-xs font-semibold text-blue-700 mt-0.5">
                        Triage- &amp; Interventionsvermerk zur Fallakte
                      </div>
                    </div>
                    <div className="text-right text-[11px] space-y-0.5 text-slate-600">
                      <div><strong className="text-slate-900">Aktenzeichen:</strong> {caseId}</div>
                      <div><strong className="text-slate-900">Datum:</strong> {todayStr}</div>
                      <div><strong className="text-slate-900">Uhrzeit:</strong> {timeStr} Uhr</div>
                      <div><strong className="text-slate-900">Bezirk:</strong> {formData.district || 'Berlinweit'}</div>
                    </div>
                  </div>
                </div>

                {/* Meta Summary Table */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Wohnsituation:</span>
                    <strong className="text-slate-900">{housingLabels[formData.housingStatus] || formData.housingStatus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dringlichkeit:</span>
                    <strong className="text-slate-900">{urgencyLabels[formData.urgency] || formData.urgency}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Aufenthalt:</span>
                    <strong className="text-slate-900">{residenceLabels[formData.residenceStatus] || formData.residenceStatus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fachkraft:</span>
                    <strong className="text-slate-900">{caseworkerName}</strong>
                  </div>
                </div>

                {/* Legal Safeguards & Statutes */}
                {result.legalContext && result.legalContext.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Einschlägige Rechtsgrundlagen &amp; Zuständigkeiten:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.legalContext.map((law, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-300">
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Evaluation */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    1. Sachverhalt &amp; Sozialrechtliche Einschätzung
                  </h3>
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-slate-800 leading-normal">
                    {result.summary}
                  </div>
                </div>

                {/* Structured Intervention Plan */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                    2. Verbindlicher Stufenplan ({result.steps.length} Phasen)
                  </h3>

                  <div className="space-y-3">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 break-inside-avoid">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-white font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              STUFE {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900">{step.title}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Phase: {step.phase}
                          </span>
                        </div>

                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          {step.action}
                        </p>

                        {/* Docs */}
                        {step.requiredDocs && step.requiredDocs.length > 0 && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                            <strong className="text-slate-700 block mb-1">Erforderliche Unterlagen / Nachweise:</strong>
                            <div className="grid grid-cols-2 gap-1 text-slate-600">
                              {step.requiredDocs.map((doc, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 border border-slate-400 rounded-xs inline-block bg-white" />
                                  <span>{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Facilities */}
                        {step.matchedFacilities && step.matchedFacilities.length > 0 && (
                          <div className="pt-1 text-[11px]">
                            <strong className="text-slate-700 block mb-1">Zuständige Anlaufstelle(n):</strong>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {step.matchedFacilities.map((fac: any) => {
                                const addr = typeof fac.address === 'string' ? fac.address : fac.address?.street || '';
                                const phone = fac.phone || fac.contact?.phone;
                                return (
                                  <div key={fac.id} className="p-1.5 bg-slate-50 rounded border border-slate-200">
                                    <div className="font-bold text-slate-900">{fac.name}</div>
                                    {addr && <div className="text-slate-600 text-[10px]">📍 {addr}</div>}
                                    {phone && <div className="text-slate-600 text-[10px]">📞 Tel: {phone}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signoff / Handzeichen Block */}
                <div className="pt-4 border-t-2 border-slate-900 break-inside-avoid space-y-4">
                  <p className="text-[10px] text-slate-500 italic">
                    Dieser Aktenvermerk wurde digital gestützt mit dem Polaris Sozialarbeiter-Kompass Berlin erstellt. 
                    Verarbeitung personenbezogener Klientendaten erfolgt DSGVO-konform ohne dauerhafte PII-Speicherung (§ 35 SGB I).
                  </p>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div>
                      <div className="border-b border-slate-400 pb-8" />
                      <div className="text-[10px] text-slate-600 mt-1">
                        Datum, Ort &amp; Handzeichen (Fachkraft: {caseworkerName})
                      </div>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-8" />
                      <div className="text-[10px] text-slate-600 mt-1">
                        Kenntnisnahme Teamleitung / Träger ({agencyName})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* VIEW B: KLIENTEN-LAUFZETTEL (HANDOUT)                      */}
            {/* ========================================================== */}
            {exportMode === 'klient' && (
              <div className="space-y-6 text-xs leading-relaxed">
                {/* Client Friendly Header */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-black text-slate-950 tracking-tight">POLARIS</h1>
                      <div className="text-xs font-semibold text-slate-700">
                        Persönlicher Fahrplan &amp; Checkliste für Ihre Beratung
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-600">
                      <div>Datum: {todayStr}</div>
                      <div>Bezirk: {formData.district || 'Berlinweit'}</div>
                    </div>
                  </div>
                  <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                    <strong>Hinweis:</strong> Dieser Laufzettel fasst die nächsten Schritte für Sie zusammen. 
                    Bitte bringen Sie die abgehakten Dokumente zu den angegebenen Sprechzeiten mit.
                  </div>

                  {/* QR Navigation Card for Client Smartphone */}
                  {(() => {
                    const primaryFacility = result.steps.find((s) => s.matchedFacilities && s.matchedFacilities.length > 0)?.matchedFacilities?.[0];
                    if (!primaryFacility) return null;
                    const addrStr = typeof primaryFacility.address === 'string' ? primaryFacility.address : primaryFacility.address?.street || '';
                    return (
                      <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs space-y-0.5">
                          <strong className="text-slate-900 block font-bold">Wegbeschreibung für Ihr Smartphone:</strong>
                          <span className="text-slate-600 text-[11px]">
                            Direkte Navigation zur zuständigen Anlaufstelle (<strong>{primaryFacility.name}</strong>)
                          </span>
                        </div>
                        <QRCodeCard
                          value={getTransitDirectionsUrl(`${primaryFacility.name}, ${addrStr}, Berlin`)}
                          label="Live-Navigation"
                          sublabel="Scannen für Google Maps & ÖPNV"
                          size={80}
                          className="p-1 border-none bg-transparent shadow-none shrink-0"
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Steps for Client */}
                <div className="space-y-4">
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="border border-slate-300 rounded-xl p-4 bg-white space-y-3 break-inside-avoid shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-sm text-slate-950">{step.title}</h3>
                      </div>

                      <p className="text-slate-800 text-xs leading-relaxed pl-8">
                        {step.action}
                      </p>

                      {/* Document Checklist */}
                      {step.requiredDocs && step.requiredDocs.length > 0 && (
                        <div className="ml-8 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <strong className="block text-slate-800 mb-2 font-bold text-xs">
                            Bitte mitbringen (Checkliste):
                          </strong>
                          <div className="space-y-1.5">
                            {step.requiredDocs.map((doc, dIdx) => (
                              <label key={dIdx} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-400 text-blue-600" />
                                <span>{doc}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Locations */}
                      {step.matchedFacilities && step.matchedFacilities.length > 0 && (
                        <div className="ml-8 space-y-2">
                          <strong className="block text-slate-800 text-xs font-bold">
                            Hierhin können Sie sich wenden:
                          </strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {step.matchedFacilities.map((fac: any) => {
                              const addr = typeof fac.address === 'string' ? fac.address : fac.address?.street || '';
                              const phone = fac.phone || fac.contact?.phone;
                              return (
                                <div key={fac.id} className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs">
                                  <div className="font-bold text-slate-950">{fac.name}</div>
                                  {addr && <div className="text-slate-700 text-[11px] mt-0.5">📍 {addr}</div>}
                                  {phone && <div className="text-slate-700 text-[11px] font-medium mt-0.5">📞 {phone}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500">
                  Erstellt mit Polaris — Sozialarbeiter-Kompass Berlin • Social Work Hub
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
