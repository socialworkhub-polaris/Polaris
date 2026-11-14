'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Sparkles, ShieldCheck, CreditCard, MessageSquare, ClipboardList } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import TeamSelectorDropdown from '@/components/TeamSelectorDropdown';
import { TeamModal } from '@/components/TeamModal';
import { LegalModal } from '@/components/LegalModal';
import LicenseModal from '@/components/LicenseModal';
import FeedbackModal from '@/components/FeedbackModal';
import TeamFeatureShowcaseModal from '@/components/TeamFeatureShowcaseModal';
import { useLanguage } from '@/lib/LanguageContext';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';

export interface FacilityCounts {
  total: number;
  filtered: number;
  totalAmt: number;
  totalTraeger: number;
  filteredAmt: number;
  filteredTraeger: number;
}

interface HeaderProps {
  counts?: FacilityCounts;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  dataSource?: 'supabase' | 'notion' | 'mock';
  onRefresh?: () => void;
  isLoading?: boolean;
  onOpenTriage?: () => void;
  onOpenTeamHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  counts,
  onResetFilters,
  hasActiveFilters,
  dataSource = 'mock',
  onRefresh,
  isLoading = false,
  onOpenTriage,
  onOpenTeamHub,
}) => {
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { currentOrganization, announcements } = useTeam();
  const { user } = useAuth();
  const hasUrgentOrPinned = (announcements || []).some((a) => a?.isPinned || a?.priority === 'urgent');
  const headerRef = useRef<HTMLElement>(null);

  const isTeamActive = !!currentOrganization && (
    currentOrganization.subscriptionStatus === 'active' ||
    (currentOrganization.subscriptionStatus === 'trialing' &&
      (!currentOrganization.trialEndsAt || new Date(currentOrganization.trialEndsAt) > new Date()))
  );

  useEffect(() => {
    const handleOpenShowcase = () => setIsShowcaseOpen(true);
    const handleOpenLicense = () => setIsLicenseOpen(true);
    const handleOpenTeam = () => setIsTeamModalOpen(true);

    window.addEventListener('polaris:open-team-showcase', handleOpenShowcase);
    window.addEventListener('polaris:open-license', handleOpenLicense);
    window.addEventListener('polaris:open-team', handleOpenTeam);
    return () => {
      window.removeEventListener('polaris:open-team-showcase', handleOpenShowcase);
      window.removeEventListener('polaris:open-license', handleOpenLicense);
      window.removeEventListener('polaris:open-team', handleOpenTeam);
    };
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          '--header-height',
          `${headerRef.current.offsetHeight}px`
        );
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <header ref={headerRef} className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Linker Bereich: Logo, Titel & Aktions-Buttons nebeneinander */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-wrap">
            
            {/* Logo & Titel */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-inner flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-100 fill-blue-200/40" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    Polaris
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full hidden sm:inline-block">
                    Sozialarbeit Triage
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden xl:block">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Buttons gruppiert auf der linken Seite */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs flex-wrap">
              {/* Smart Triage Button */}
              {onOpenTriage && (
                <button
                  type="button"
                  onClick={onOpenTriage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>{t.smartTriage}</span>
                </button>
              )}

              {/* Lizenz erwerben Button */}
              <button
                type="button"
                onClick={() => setIsLicenseOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer text-xs font-medium shrink-0"
                title="Team-Lizenz für Träger & Einrichtungen"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.getLicense}</span>
              </button>

              {/* Datenschutz & Impressum Button mit Outline */}
              <button
                type="button"
                onClick={() => setIsLegalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg transition-all cursor-pointer text-xs shrink-0 shadow-xs"
                title="Datenschutz, Impressum & Rechtliche Hinweise"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">{t.privacy}</span>
              </button>

              {/* Feedback Button mit Outline */}
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg transition-all cursor-pointer text-xs shrink-0 shadow-xs"
                title="Feedback oder Feature-Idee melden"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{t.giveFeedback}</span>
              </button>
            </div>

          </div>

          {/* Rechter Bereich: Team-Dropdown, Schwarzes Brett, Account/Profil & Abmelden, Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs shrink-0 ml-auto">
            {/* 1. Team Selector Dropdown (Links von Schwarzem Brett) */}
            {user && (
              <TeamSelectorDropdown onOpenTeamModal={() => setIsTeamModalOpen(true)} />
            )}

            {/* 2. Schwarzes Brett & Dienstübergabe Button (gruppiert bei Team & Profil) */}
            {isTeamActive && onOpenTeamHub ? (
              <button
                type="button"
                onClick={onOpenTeamHub}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
                title={`Schwarzes Brett & Dienstübergabe (${currentOrganization?.name || 'Team'})`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-200" />
                <span className="hidden sm:inline">Schwarzes Brett</span>
                {hasUrgentOrPinned && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 ring-2 ring-indigo-900 animate-pulse" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsShowcaseOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white border border-indigo-700/60 rounded-lg transition-colors cursor-pointer text-xs font-medium shrink-0"
                title="Schwarzes Brett & Dienstübergabe (Träger- & Team-Funktion)"
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Schwarzes Brett</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded border border-indigo-500/30 font-bold hidden md:inline">
                  Team
                </span>
              </button>
            )}

            {/* 3 & 4. Benutzer-Profil (Account) & Abmelden (Sign Out) */}
            <UserMenu />

            {/* 5. Language Switcher (DE | EN) - Ganz rechts */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setLang('de')}
                className={`px-2 py-0.5 rounded transition ${lang === 'de' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                title="Auf Deutsch umschalten"
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition ${lang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                title="Switch to English"
              >
                EN
              </button>
            </div>
          </div>

        </div>
      </div>

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
      />

      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      <TeamFeatureShowcaseModal
        isOpen={isShowcaseOpen}
        onClose={() => setIsShowcaseOpen(false)}
        onOpenLicenseModal={() => setIsLicenseOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </header>
  );
};
