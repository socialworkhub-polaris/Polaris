'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'de' | 'en';

export const translations = {
  de: {
    // Header
    smartTriage: 'Smart Triage',
    getLicense: 'Lizenz erwerben',
    privacy: 'Datenschutz',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    filterReset: 'Filter lösen',
    authoritiesCount: 'Behörden:',
    agenciesCount: 'Träger:',
    
    // FilterBar
    searchPlaceholder: 'Suche nach Name, Träger, Bezirk, § SGB...',
    favorites: 'Favoriten',
    coldRelief: 'Kältehilfe',
    allInstitutions: 'Alle',
    authoritiesTab: 'Behörden / Ämter',
    agenciesTab: 'Freie Träger',
    allAccess: 'Alle Zugänge',
    walkIn: 'Walk-In',
    appointment: 'Termin',
    application: 'Antrag (SGB)',
    allFocus: 'Alle Schwerpunkte',
    allDistricts: 'Alle Bezirke',
    wheelchairOnly: 'Nur rollstuhlgerecht',
    allLanguages: 'Alle Beratungssprachen',
    
    // Mobile Bar & Hotlines
    hotlinesTitle: 'Streetwork Notfall-Hotlines (Berlin)',
    quickDial: 'Schnellwahl (1-Tap)',
    close: 'Schließen',
    hotlineSub: 'Direkte Notrufnummern für akute Gefährdungslagen im Außendienst.',
    
    // Drawer & Actions
    openPrint: 'Klienten-Handout drucken',
    shareWhatsApp: 'Per WhatsApp teilen',
    copiedText: 'In die Zwischenablage kopiert!',
    copyInfo: 'Info kopieren',
    reportCorrection: 'Korrektur melden',
    
    // Feedback
    giveFeedback: 'Feedback geben',
  },
  en: {
    // Header
    smartTriage: 'Smart Triage',
    getLicense: 'Get Team License',
    privacy: 'Privacy & Legal',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    filterReset: 'Reset Filters',
    authoritiesCount: 'Offices:',
    agenciesCount: 'NGOs:',
    
    // FilterBar
    searchPlaceholder: 'Search by name, organization, district, § law...',
    favorites: 'Favorites',
    coldRelief: 'Winter Relief',
    allInstitutions: 'All',
    authoritiesTab: 'Public Authorities',
    agenciesTab: 'Non-Profits & NGOs',
    allAccess: 'All Access Types',
    walkIn: 'Walk-In',
    appointment: 'Appointment',
    application: 'Application',
    allFocus: 'All Focus Areas',
    allDistricts: 'All Districts',
    wheelchairOnly: 'Wheelchair accessible only',
    allLanguages: 'All Consultation Languages',
    
    // Mobile Bar & Hotlines
    hotlinesTitle: 'Streetwork Emergency Hotlines (Berlin)',
    quickDial: 'Quick Dial (1-Tap)',
    close: 'Close',
    hotlineSub: 'Direct emergency numbers for acute frontline crises.',
    
    // Drawer & Actions
    openPrint: 'Print Client Handout',
    shareWhatsApp: 'Share via WhatsApp',
    copiedText: 'Copied to clipboard!',
    copyInfo: 'Copy Details',
    reportCorrection: 'Report Correction',
    
    // Feedback
    giveFeedback: 'Send Feedback',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['de'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'de',
  setLang: () => {},
  t: translations.de,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('de');

  useEffect(() => {
    const saved = localStorage.getItem('polaris_lang') as Language;
    if (saved === 'de' || saved === 'en') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('polaris_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
