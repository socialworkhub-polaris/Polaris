import { Facility, BerlinDistrict } from '@/types/facility';
import { IngestionAdapter, IngestionSourceMeta } from '../types';
import { resolveDistrict, ensureCoordinates } from '../districtResolver';

const BERLIN_CKAN_GEOJSON_URL =
  'https://www.berlin.de/ba-marzahn-hellersdorf/politik-und-verwaltung/aemter/jugendamt/einrichtungssuche/index.php/index/all.geojson?q=';

export class BerlinOpenDataAdapter implements IngestionAdapter {
  meta: IngestionSourceMeta = {
    id: 'berlin-ckan-places',
    name: 'Open Data Berlin (Freie Träger & Jugend/Familien-Zentren)',
    region: 'Berlin',
    url: 'https://datenregister.berlin.de/dataset/simple_search_wwwberlindebamarzahnhellersdorfpolitikundverwaltungaemterjugendamteinrichtungssuche',
    license: 'cc-by / Datenlizenz Deutschland – Version 2.0',
  };

  async fetch(): Promise<Facility[]> {
    const facilities: Facility[] = [];

    try {
      const res = await fetch(BERLIN_CKAN_GEOJSON_URL, {
        headers: {
          'User-Agent': 'Polaris-SocialWorkHub/1.0',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status} fetching Berlin CKAN GeoJSON`);
      }

      const geojsonData = await res.json();
      const features: any[] = Array.isArray(geojsonData?.features) ? geojsonData.features : [];

      for (const feature of features) {
        try {
          const props = feature.properties || {};
          const data = props.data || {};

          // Extract basic info
          const rawName = (data.einrichtung || props.title || '').trim();
          if (!rawName) continue;

          const rawAddress = (data.adresse || '').trim();
          const plzMatch = rawAddress.match(/\b(1\d{4})\b/);
          const zipCode = plzMatch ? plzMatch[1] : '';

          // District resolution
          const district = resolveDistrict({
            plz: zipCode,
            name: rawName,
            rawDistrict: data.region || '',
            email: data.e_mail || '',
          });

          // Coordinates extraction from GeoJSON Point: [lon, lat]
          let coords: [number, number] | null = null;
          if (
            feature.geometry?.type === 'Point' &&
            Array.isArray(feature.geometry.coordinates) &&
            feature.geometry.coordinates.length === 2
          ) {
            const [lon, lat] = feature.geometry.coordinates;
            coords = [Number(lat), Number(lon)];
          } else if (data._wgs84_lat && data._wgs84_lon) {
            coords = [Number(data._wgs84_lat), Number(data._wgs84_lon)];
          }
          const validCoords = ensureCoordinates(coords, district);

          // Contact parsing
          let email = (data.e_mail || '').replace(/^mailto:/i, '').trim();
          let phone = (data.telefon || '').trim();
          let website = (data.homepage || '').trim();

          // Opening hours compilation
          const hoursDays = [
            data.montag ? `Mo: ${data.montag}` : '',
            data.dienstag ? `Di: ${data.dienstag}` : '',
            data.mittwoch ? `Mi: ${data.mittwoch}` : '',
            data.donnerstag ? `Do: ${data.donnerstag}` : '',
            data.freitag ? `Fr: ${data.freitag}` : '',
          ].filter(Boolean);
          const walkInHours = hoursDays.length > 0 ? hoursDays.join(', ') : 'Offene Sprechzeiten / Walk-In vor Ort.';

          // Category classification
          const art = (data.art || '').toLowerCase();
          const traeger = (data.traeger || 'Freier Träger').trim();

          const facility: Facility = {
            id: `berlin-opendata-${String(data.id || props.id || Math.abs(hashCode(rawName)))}`,
            name: rawName,
            subTitle: `${data.art || 'Einrichtung'} • Träger: ${traeger}`,
            institutionType: 'traeger',
            accessType: 'niedrigschwellig',
            primaryFocus: art.includes('kris') || art.includes('gesund')
              ? 'psychosozial_gesundheit'
              : 'freizeit_offen',
            ageGroups: ['u18', 'junge_erwachsene', 'erwachsene'],
            district: district,
            address: {
              street: rawAddress.split(',')[0]?.trim() || rawAddress || 'Adresse auf Anfrage',
              zipCode: zipCode || '12623',
              city: 'Berlin',
            },
            coordinates: validCoords,
            transit: {
              station: `ÖPNV im Bezirk ${district}`,
              lines: ['S-Bahn / Tram / Bus Berlin'],
              walkingTime: 'Ca. 3–5 Min. Fußweg',
            },
            contact: {
              phone: phone || '(030) Vermittlung über Träger',
              email: email,
              website: website || 'https://www.berlin.de',
              intakePerson: data.ansprechpartner || undefined,
            },
            openingHours: {
              walkIn: walkInHours,
              appointment: 'Beratungstermine nach Vereinbarung möglich.',
              phoneHours: 'Zu den regulären Öffnungszeiten erreichbar.',
            },
            intakeRules: {
              summary: `Offenes Angebot und Beratung im Bezirk ${district}. Trägerschaft: ${traeger}.`,
              procedure: '1. Niedrigschwelliger Erstkontakt vor Ort oder telefonisch. 2. Kostenfreie Erstberatung und Klärung des Anliegens.',
              regionalJurisdiction: `Schwerpunktmäßig für Bürger*innen und Familien aus ${district}.`,
              waitingTimeEstimate: 'Offener Zugang / Keine Wartezeit.',
            },
            requiredDocuments: ['Keine Ausweise oder Antragsdokumente zwingend erforderlich.'],
            legalBases: ['§ 11 SGB VIII (Jugendarbeit)', '§ 16 SGB VIII (Familienförderung)'],
            accessibility: {
              wheelchair: data.integration ? 'voll' : 'eingeschraenkt',
              languages: ['Deutsch', 'Englisch'],
              elevator: true,
            },
            internalWorkerNotes: `Träger: ${traeger}. Platzzahl/Kapazität: ${data.platzzahl || 'Standard'}. Geeignet für Familien & junge Erwachsene.`,
            targetGroups: ['Kinder & Jugendliche', 'Familien', 'Junge Erwachsene'],
            features: {
              wheelchairAccessible: Boolean(data.integration),
              languages: ['Deutsch', 'Englisch'],
              freeOfCharge: true,
              anonymous: true,
            },
          };

          facilities.push(facility);
        } catch (itemErr) {
          console.warn('Skipping item due to transform error:', itemErr);
        }
      }
    } catch (fetchErr) {
      console.error('Failed to fetch from Berlin Open Data GeoJSON:', fetchErr);
    }

    return facilities;
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
