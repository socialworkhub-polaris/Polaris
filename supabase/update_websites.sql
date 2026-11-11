-- =====================================================================
-- Migration: Enrich existing facilities with official verified websites
-- Run in Supabase SQL Editor if you wish to persist to raw table rows
-- =====================================================================

-- 1. Jobcenter Berlin (All 12 Districts)
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-mitte/"') WHERE name ILIKE '%jobcenter%mitte%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-friedrichshain-kreuzberg/"') WHERE name ILIKE '%jobcenter%friedrichshain%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-pankow/"') WHERE name ILIKE '%jobcenter%pankow%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-charlottenburg-wilmersdorf/"') WHERE name ILIKE '%jobcenter%charlottenburg%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-spandau/"') WHERE name ILIKE '%jobcenter%spandau%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-steglitz-zehlendorf/"') WHERE name ILIKE '%jobcenter%steglitz%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-tempelhof-schoeneberg/"') WHERE name ILIKE '%jobcenter%tempelhof%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-neukoelln/"') WHERE name ILIKE '%jobcenter%neuk%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-treptow-koepenick/"') WHERE name ILIKE '%jobcenter%treptow%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-marzahn-hellersdorf/"') WHERE name ILIKE '%jobcenter%marzahn%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-lichtenberg/"') WHERE name ILIKE '%jobcenter%lichtenberg%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/jobcenter-reinickendorf/"') WHERE name ILIKE '%jobcenter%reinickendorf%';

-- 2. Ämter für Soziales
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-mitte/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%mitte%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-friedrichshain-kreuzberg/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%friedrichshain%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-pankow/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%pankow%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-charlottenburg-wilmersdorf/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%charlottenburg%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-spandau/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%spandau%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-steglitz-zehlendorf/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%steglitz%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-tempelhof-schoeneberg/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%tempelhof%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-neukoelln/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%neuk%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%treptow%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-marzahn-hellersdorf/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%marzahn%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-lichtenberg/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%lichtenberg%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/ba-reinickendorf/politik-und-verwaltung/aemter/amt-fuer-soziales/"') WHERE name ILIKE '%amt für soziales%reinickendorf%';

-- 3. Berliner Krisendienst
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berliner-krisendienst.de/"') WHERE name ILIKE '%krisendienst%';

-- 4. Kältehilfe & Notübernachtungen
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berliner-stadtmission.de/notuebernachtungen"') WHERE name ILIKE '%notübernachtung%stadtmission%' OR name ILIKE '%franklinstraße%' OR name ILIKE '%lehrter straße%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.gebewo-pro.de/"') WHERE name ILIKE '%gebewo%' OR name ILIKE '%containerbahnhof%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.caritas-berlin.de/beratung-und-hilfe/wohnungslosigkeit/notuebernachtungen"') WHERE name ILIKE '%notübernachtung%caritas%' OR name ILIKE '%st. josef%' OR name ILIKE '%lili marleen%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://karuna-ev.de/"') WHERE name ILIKE '%kick%' OR name ILIKE '%karuna%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.kaeltehilfe-berlin.de/"') WHERE contact->>'website' IS NULL OR contact->>'website' = '' AND (name ILIKE '%kälte%' OR name ILIKE '%notübernachtung%');

-- 5. Kliniken & Notaufnahmen
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.vivantes.de/"') WHERE name ILIKE '%vivantes%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.charite.de/"') WHERE name ILIKE '%charité%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.alexianer-berlin-hedwig.de/"') WHERE name ILIKE '%alexianer%' OR name ILIKE '%st. hedwig%';

-- 6. EUTB (Teilhabeberatung)
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.teilhabeberatung.de/"') WHERE name ILIKE '%eutb%';

-- 7. Freie Träger & Fachstellen
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://al-dar.de/"') WHERE name ILIKE '%al-dar%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://kub-berlin.org/"') WHERE name ILIKE '%kub%' AND name ILIKE '%flüchtlinge%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://bbzberlin.de/"') WHERE name ILIKE '%bbz%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://fluechtlingsrat-berlin.de/"') WHERE name ILIKE '%flüchtlingsrat%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://tacheles-sozialhilfe.de/"') WHERE name ILIKE '%tacheles%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berliner-arbeitslosenzentrum.de/"') WHERE name ILIKE '%balz%' OR name ILIKE '%arbeitslosenzentrum%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.berlin.de/laf/"') WHERE name ILIKE '%laf%' OR name ILIKE '%ankunftszentrum%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://ueberleben.org/"') WHERE name ILIKE '%überleben%' OR name ILIKE '%bzfo%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.fixpunkt.org/"') WHERE name ILIKE '%fixpunkt%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.drogennotdienst.de/"') WHERE name ILIKE '%drogennotdienst%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.vistaberlin.de/"') WHERE name ILIKE '%vista%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.tannenhof.de/"') WHERE name ILIKE '%tannenhof%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.stiftung-spi.de/"') WHERE name ILIKE '%spi%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.awo-berlin.de/"') WHERE name ILIKE '%awo%' AND (contact->>'website' IS NULL OR contact->>'website' = '');
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.diakonie-portal.de/"') WHERE name ILIKE '%diakonie%' AND (contact->>'website' IS NULL OR contact->>'website' = '');
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.caritas-berlin.de/"') WHERE name ILIKE '%caritas%' AND (contact->>'website' IS NULL OR contact->>'website' = '');
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.volkssolidaritaet.de/berlin/"') WHERE name ILIKE '%volkssolidarität%';
UPDATE public.facilities SET contact = jsonb_set(contact, '{website}', '"https://www.paritaet-berlin.de/"') WHERE name ILIKE '%parität%' OR name ILIKE '%biss%';
