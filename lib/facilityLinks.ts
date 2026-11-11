// District slug helper for berlin.de portal links
export function getDistrictSlug(district: string): string {
  const norm = (district || '').toLowerCase().trim();
  if (norm.includes('charlottenburg')) return 'charlottenburg-wilmersdorf';
  if (norm.includes('friedrichshain') || norm.includes('kreuzberg')) return 'friedrichshain-kreuzberg';
  if (norm.includes('lichtenberg')) return 'lichtenberg';
  if (norm.includes('marzahn') || norm.includes('hellersdorf')) return 'marzahn-hellersdorf';
  if (norm.includes('mitte')) return 'mitte';
  if (norm.includes('neukölln') || norm.includes('neukoelln')) return 'neukoelln';
  if (norm.includes('pankow')) return 'pankow';
  if (norm.includes('reinickendorf')) return 'reinickendorf';
  if (norm.includes('spandau')) return 'spandau';
  if (norm.includes('steglitz') || norm.includes('zehlendorf')) return 'steglitz-zehlendorf';
  if (norm.includes('tempelhof') || norm.includes('schöneberg') || norm.includes('schoeneberg')) return 'tempelhof-schoeneberg';
  if (norm.includes('treptow') || norm.includes('köpenick') || norm.includes('koepenick')) return 'treptow-koepenick';
  return 'mitte';
}

// Exact curated map for specific known facilities
const EXACT_FACILITY_LINKS: Record<string, string> = {
  'notion-al-dar-e-v-beratung-fuer-arabische-migrant-in-17': 'https://al-dar.de/',
  'notion-kontakt-und-beratungsstelle-fuer-fluechtlinge-25': 'https://kub-berlin.org/',
  'notion-bbz-beratungs-und-betreuungszentrum-fuer-jung-23': 'https://bbzberlin.de/',
  'notion-fluechtlingsrat-berlin-e-v-24': 'https://fluechtlingsrat-berlin.de/',
  'notion-arbeitslosenberatung-tacheles-e-v-partnerstel-37': 'https://tacheles-sozialhilfe.de/',
  'notion-berliner-arbeitslosenzentrum-evangelischer-ki-38': 'https://www.berliner-arbeitslosenzentrum.de/',
  'notion-landesamt-fuer-fluechtlingsangelegenheiten-la-26': 'https://www.berlin.de/laf/',
  'notion-zentrum-fuer-ueberlebende-von-folter-und-krie-19': 'https://ueberleben.org/',
  'notion-drogennotdienst-luetzowstrasse-dnd-62': 'https://www.drogennotdienst.de/',
  'notion-fixpunkt-e-v-kontaktladen-ska-60': 'https://www.fixpunkt.org/',
  'notion-fixpunkt-e-v-kontaktstelle-druckausgleich-61': 'https://www.fixpunkt.org/',
  'notion-charit-campus-mitte-psychiatrische-notaufnahm-8': 'https://www.charite.de/',
  'notion-st-hedwig-krankenhaus-psychiatrische-notaufna-7': 'https://www.alexianer-berlin-hedwig.de/',
  'notion-kubus-notuebernachtung-koepenicker-strasse-44': 'https://kubus-berlin.de/',
  'notion-notuebernachtung-fuer-frauen-mittendrin-kubus-47': 'https://kubus-berlin.de/',
  'notion-notuebernachtung-haus-schoeneweide-unionhilfs-39': 'https://www.unionhilfswerk.de/',
  'notion-sleep-in-kick-notuebernachtung-fuer-jugendlic-43': 'https://karuna-ev.de/',
  'notion-notuebernachtung-am-containerbahnhof-gebewo-46': 'https://www.gebewo-pro.de/',
  'notion-kaeltehilfe-wegweiser-notuebernachtung-kub-ge-40': 'https://www.gebewo-pro.de/',
  'notion-notuebernachtung-franklinstrasse-berliner-sta-48': 'https://www.berliner-stadtmission.de/notuebernachtungen',
  'notion-notuebernachtung-lehrter-strasse-berliner-sta-45': 'https://www.berliner-stadtmission.de/notuebernachtungen',
  'notion-notuebernachtung-st-josef-caritas-41': 'https://www.caritas-berlin.de/beratung-und-hilfe/wohnungslosigkeit/notuebernachtungen',
  'notion-notuebernachtung-lili-marleen-fuer-frauen-car-42': 'https://www.caritas-berlin.de/beratung-und-hilfe/wohnungslosigkeit/notuebernachtungen',
  'notion-buergerberatung-sozialrecht-charlottenburg-de-33': 'https://www.paritaet-berlin.de/',
  'notion-jugendmigrationsdienst-jmd-pankow-cjd-20': 'https://www.cjd.de/',
  'notion-unabhaengige-buergerberatung-marzahn-hellersd-29': 'https://kiek-in-berlin.de/',
  'notion-jugendtreff-nachbarschaftscafe-oase-122': 'https://www.berlin.de/ba-friedrichshain-kreuzberg/',
};

export function resolveFallbackWebsite(facility: { id?: string; name: string; district?: string }): string {
  if (facility.id && EXACT_FACILITY_LINKS[facility.id]) {
    return EXACT_FACILITY_LINKS[facility.id];
  }

  const name = (facility.name || '').toLowerCase();
  const slug = getDistrictSlug(facility.district || '');

  // 1. Jobcenter
  if (name.includes('jobcenter')) {
    return `https://www.berlin.de/jobcenter-${slug}/`;
  }

  // 2. Amt für Soziales / Sozialamt
  if (name.includes('amt für soziales') || name.includes('sozialamt')) {
    return `https://www.berlin.de/ba-${slug}/politik-und-verwaltung/aemter/amt-fuer-soziales/`;
  }

  // 3. Jugendamt / RSD
  if (name.includes('jugendamt') || /\brsd\b/i.test(name) || name.includes('regionaler sozialdienst')) {
    return `https://www.berlin.de/ba-${slug}/politik-und-verwaltung/aemter/jugendamt/`;
  }

  // 4. Wohnungsamt
  if (name.includes('wohnungsamt') || name.includes('wohnung')) {
    return `https://www.berlin.de/ba-${slug}/politik-und-verwaltung/aemter/buergeramt-wohnungswesen/`;
  }

  // 5. Berliner Krisendienst
  if (name.includes('krisendienst')) {
    return 'https://www.berliner-krisendienst.de/';
  }

  // 6. Notübernachtung & Kältehilfe
  if (name.includes('kälte') || name.includes('notübernachtung') || name.includes('sleep in')) {
    return 'https://www.kaeltehilfe-berlin.de/';
  }

  // 7. Kliniken & Notaufnahmen
  if (name.includes('vivantes')) return 'https://www.vivantes.de/';
  if (name.includes('charité')) return 'https://www.charite.de/';
  if (name.includes('alexianer') || name.includes('st. hedwig')) return 'https://www.alexianer-berlin-hedwig.de/';

  // 8. EUTB (Teilhabeberatung)
  if (name.includes('eutb')) return 'https://www.teilhabeberatung.de/';

  // 9. Suchtberatung & Drogenhilfe
  if (name.includes('sucht') || name.includes('droge')) {
    if (name.includes('vista')) return 'https://www.vistaberlin.de/';
    if (name.includes('tannenhof')) return 'https://www.tannenhof.de/';
    if (name.includes('caritas')) return 'https://www.caritas-berlin.de/beratung-und-hilfe/suchthilfe/';
    if (name.includes('spi')) return 'https://www.stiftung-spi.de/';
    return 'https://www.drogennotdienst.de/';
  }

  // 10. Wohlfahrtsverbände & Sozialberatung
  if (name.includes('caritas')) return 'https://www.caritas-berlin.de/';
  if (name.includes('diakonie')) return 'https://www.diakonie-portal.de/';
  if (name.includes('awo')) return 'https://www.awo-berlin.de/';
  if (name.includes('volkssolidarität') || name.includes('volkssolidaritaet')) return 'https://www.volkssolidaritaet.de/berlin/';
  if (name.includes('parität')) return 'https://www.paritaet-berlin.de/';

  return `https://www.berlin.de/ba-${slug}/`;
}
