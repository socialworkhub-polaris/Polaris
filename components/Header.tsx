'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Sparkles, ShieldCheck, CreditCard, MessageSquare, ClipboardList, Mail, ChevronDown, Landmark } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import TeamSelectorDropdown from '@/components/TeamSelectorDropdown';
import { TeamModal } from '@/components/TeamModal';
import { LegalModal } from '@/components/LegalModal';
import LicenseModal from '@/components/LicenseModal';
import FeedbackModal from '@/components/FeedbackModal';
import { NewsletterModal } from '@/components/NewsletterModal';
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
  onOpenJurisdiction?: () => void;
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
  onOpenJurisdiction,
}) => {
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { currentOrganization, organizations, announcements } = useTeam();
  const { user } = useAuth();
  const hasUrgentOrPinned = (announcements || []).some((a) => a?.isPinned || a?.priority === 'urgent');
  const headerRef = useRef<HTMLElement>(null);
  const updatesDropdownRef = useRef<HTMLDivElement>(null);

  const isTeamActive = !!currentOrganization && (
    currentOrganization.subscriptionStatus === 'active' ||
    (currentOrganization.subscriptionStatus === 'trialing' &&
      (!currentOrganization.trialEndsAt || new Date(currentOrganization.trialEndsAt) > new Date()))
  );

  const hasAnyActiveLicense = (organizations || []).some((org) =>
    org.subscriptionStatus === 'active' ||
    (org.subscriptionStatus === 'trialing' &&
      (!org.trialEndsAt || new Date(org.trialEndsAt) > new Date()))
  );

  const isLicensed = isTeamActive || hasAnyActiveLicense;

  useEffect(() => {
    const handleOpenShowcase = () => setIsShowcaseOpen(true);
    const handleOpenLicense = () => setIsLicenseOpen(true);
    const handleOpenTeam = () => setIsTeamModalOpen(true);
    const handleOpenNewsletter = () => setIsNewsletterOpen(true);

    const updateOnlineStatus = () => {
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    };
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    window.addEventListener('polaris:open-team-showcase', handleOpenShowcase);
    window.addEventListener('polaris:open-license', handleOpenLicense);
    window.addEventListener('polaris:open-team', handleOpenTeam);
    window.addEventListener('polaris:open-newsletter', handleOpenNewsletter);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('polaris:open-team-showcase', handleOpenShowcase);
      window.removeEventListener('polaris:open-license', handleOpenLicense);
      window.removeEventListener('polaris:open-team', handleOpenTeam);
      window.removeEventListener('polaris:open-newsletter', handleOpenNewsletter);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (updatesDropdownRef.current && !updatesDropdownRef.current.contains(e.target as Node)) {
        setIsUpdatesOpen(false);
      }
    };
    if (isUpdatesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUpdatesOpen]);

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
      {isOffline && (
        <div className="w-full bg-amber-400 text-slate-950 px-3 py-1 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-500 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
          <span>Offline-Streetwork aktiv: Lokaler Datenpuffer & Offline-Triage einsatzbereit.</span>
        </div>
      )}
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

              {/* Amts- & Behördenzuständigkeit (LOR) */}
              {onOpenJurisdiction && (
                <button
                  type="button"
                  onClick={onOpenJurisdiction}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg transition-all cursor-pointer text-xs shrink-0 shadow-xs"
                  title="Zuständige Pflichtbehörden (Jobcenter, RSD, Soziale Wohnhilfe, SpDi) ermitteln"
                >
                  <Landmark className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Ämter-Zuständigkeit</span>
                </button>
              )}

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

              {/* Updates & News Dropdown */}
              <div ref={updatesDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUpdatesOpen(!isUpdatesOpen)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs shrink-0 shadow-xs border ${
                    isUpdatesOpen
                      ? 'bg-slate-800 text-white border-blue-500/80 shadow-blue-500/10'
                      : 'text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                  title="Neuigkeiten, Plattform-Updates & Newsletter"
                  aria-expanded={isUpdatesOpen}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">{t.updatesAndNews}</span>
                  <span className="md:hidden">News</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isUpdatesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUpdatesOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Newsletter Action Item */}
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUpdatesOpen(false);
                          setIsNewsletterOpen(true);
                        }}
                        className="w-full text-left p-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 transition-colors flex items-start gap-2.5 group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30 shrink-0 mt-0.5">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-blue-200">
                              {t.subscribeNewsletter}
                            </span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-500/30">
                              Kostenlos
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                            Monatliche Fachinfos, Kältehilfe-Aktionen & SGB-Rechtsänderungen per E-Mail.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Platform News Highlights */}
                    <div className="px-3.5 pt-2 pb-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {t.whatsNew}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 space-y-2 text-[11px]">
                      <div className="flex items-start gap-2 text-slate-300">
                        <ClipboardList className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-100 font-semibold block">Schwarzes Brett & Übergaben</strong>
                          <span className="text-slate-400">Gemeinsame Team-Notizen & Kalender für Einrichtungen.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-100 font-semibold block">SGB KI-Triage 2.0</strong>
                          <span className="text-slate-400">Paragraphengenaue Stufenpläne für Berliner Notlagen.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-100 font-semibold block">Kältehilfe & Notruf-Leitfaden</strong>
                          <span className="text-slate-400">Streetwork-Hotlines mit 1-Tap Schnellwahl.</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Feedback Hint */}
                    <div className="mt-1 px-3 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Idee für ein Feature?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUpdatesOpen(false);
                          setIsFeedbackOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
                      >
                        {t.giveFeedback}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lizenz erwerben Button: An die rechte Seite der linken Gruppe gesetzt, damit beim Ausblenden nichts nach links rutscht */}
              {!isLicensed && (
                <button
                  type="button"
                  onClick={() => setIsLicenseOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer text-xs font-medium shrink-0"
                  title="Team-Lizenz für Träger & Einrichtungen"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.getLicense}</span>
                </button>
              )}
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

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </header>
  );
};
