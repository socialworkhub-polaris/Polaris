'use client';

import React, { useState, useEffect } from 'react';
import { Check, Copy, Share2, Sparkles, Users, X, ArrowRight } from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';

export default function BillingSuccessModal() {
  const { currentOrganization, organizations, refreshOrganizations } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      setIsOpen(true);
      if (refreshOrganizations) {
        refreshOrganizations();
      }
      // Clean query params from URL without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [refreshOrganizations]);

  if (!isOpen) return null;

  const targetOrg = currentOrganization || organizations[0];
  const inviteCode = targetOrg?.inviteCode || 'BEREIT';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://polaris-socialworkhub.net';
  const joinLink = `${origin}/?join=${inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hallo Team! Unsere Polaris Team-Lizenz ist jetzt aktiv. Trete unserem Workspace "${targetOrg?.name || 'Team'}" bei mit dem Code:\n\n👉 ${inviteCode}\n\nOder direkt über den Link:\n${joinLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-6 text-center space-y-4">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Sparkles className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">
            Team-Lizenz erfolgreich aktiviert!
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Willkommen bei Polaris Pro. Dein Workspace {targetOrg ? `"${targetOrg.name}"` : ''} ist jetzt freigeschaltet.
          </p>
        </div>

        {/* Invite Code Box */}
        <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 text-left">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Team-Code für deine Kolleg*innen (10 Plätze):
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-center text-lg font-extrabold tracking-widest text-emerald-400 select-all">
              {inviteCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"
              title="Code kopieren"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* WhatsApp & Done Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Per WhatsApp an Kollegen senden</span>
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fertig & Workspace öffnen
          </button>
        </div>
      </div>
    </div>
  );
}
