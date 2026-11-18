import { BerlinDistrict } from '@/types/facility';

export interface StreetSuggestion {
  name: string;
  district: BerlinDistrict;
  type: 'street' | 'locality' | 'place';
  subtitle?: string;
}

/**
 * Curated index of Berlin streets, boulevards, squares and localities
 * mapped to their responsible administrative district (LOR).
 */
export const BERLIN_STREETS_INDEX: StreetSuggestion[] = [
  // --- NEUKÖLLN ---
  { name: 'Sonnenallee', district: 'Neukölln', type: 'street' },
  { name: 'Karl-Marx-Straße', district: 'Neukölln', type: 'street' },
  { name: 'Hermannstraße', district: 'Neukölln', type: 'street' },
  { name: 'Hermannplatz', district: 'Neukölln', type: 'place' },
  { name: 'Weserstraße', district: 'Neukölln', type: 'street' },
  { name: 'Pannierstraße', district: 'Neukölln', type: 'street' },
  { name: 'Flughafenstraße', district: 'Neukölln', type: 'street' },
  { name: 'Columbiadamm', district: 'Neukölln', type: 'street' },
  { name: 'Boddinstraße', district: 'Neukölln', type: 'street' },
  { name: 'Rollbergstraße', district: 'Neukölln', type: 'street' },
  { name: 'Erkstraße', district: 'Neukölln', type: 'street' },
  { name: 'Wildenbruchstraße', district: 'Neukölln', type: 'street' },
  { name: 'Treptower Straße', district: 'Neukölln', type: 'street' },
  { name: 'Grenzallee', district: 'Neukölln', type: 'street' },
  { name: 'Buschkrugallee', district: 'Neukölln', type: 'street' },
  { name: 'Britzer Damm', district: 'Neukölln', type: 'street' },
  { name: 'Buckower Chaussee', district: 'Neukölln', type: 'street' },
  { name: 'Johannisthaler Chaussee', district: 'Neukölln', type: 'street' },
  { name: 'Fritz-Erler-Allee', district: 'Neukölln', type: 'street' },
  { name: 'Lipschitzallee', district: 'Neukölln', type: 'street' },
  { name: 'Rudower Chaussee', district: 'Neukölln', type: 'street' },
  { name: 'Neukölln', district: 'Neukölln', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Britz', district: 'Neukölln', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Buckow', district: 'Neukölln', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Rudow', district: 'Neukölln', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Gropiusstadt', district: 'Neukölln', type: 'locality', subtitle: 'Ortsteil' },

  // --- MITTE ---
  { name: 'Friedrichstraße', district: 'Mitte', type: 'street' },
  { name: 'Müllerstraße', district: 'Mitte', type: 'street' },
  { name: 'Badstraße', district: 'Mitte', type: 'street' },
  { name: 'Turmstraße', district: 'Mitte', type: 'street' },
  { name: 'Torstraße', district: 'Mitte', type: 'street' },
  { name: 'Unter den Linden', district: 'Mitte', type: 'street' },
  { name: 'Leipziger Straße', district: 'Mitte', type: 'street' },
  { name: 'Oranienburger Straße', district: 'Mitte', type: 'street' },
  { name: 'Chausseestraße', district: 'Mitte', type: 'street' },
  { name: 'Brunnenstraße', district: 'Mitte', type: 'street' },
  { name: 'Invalidenstraße', district: 'Mitte', type: 'street' },
  { name: 'Karl-Liebknecht-Straße', district: 'Mitte', type: 'street' },
  { name: 'Alexanderplatz', district: 'Mitte', type: 'place' },
  { name: 'Rosenthaler Straße', district: 'Mitte', type: 'street' },
  { name: 'Reinickendorfer Straße', district: 'Mitte', type: 'street' },
  { name: 'Wollankstraße', district: 'Mitte', type: 'street' },
  { name: 'Osloer Straße', district: 'Mitte', type: 'street' },
  { name: 'Seestraße', district: 'Mitte', type: 'street' },
  { name: 'Prinzenallee', district: 'Mitte', type: 'street' },
  { name: 'Pankstraße', district: 'Mitte', type: 'street' },
  { name: 'Moabit', district: 'Mitte', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wedding', district: 'Mitte', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Gesundbrunnen', district: 'Mitte', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Tiergarten', district: 'Mitte', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Hansaviertel', district: 'Mitte', type: 'locality', subtitle: 'Ortsteil' },

  // --- FRIEDRICHSHAIN-KREUZBERG ---
  { name: 'Oranienstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Wiener Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Bergmannstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Mehringdamm', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Kottbusser Damm', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Kottbusser Tor', district: 'Friedrichshain-Kreuzberg', type: 'place' },
  { name: 'Warschauer Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Simon-Dach-Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Boxhagener Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Karl-Marx-Allee', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Skalitzer Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Gitschiner Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Görlitzer Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Reichenberger Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Wrangelstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Schlesische Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Manteuffelstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Adalbertstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Mariannenstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Urbanstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Graefestraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Dieffenbachstraße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Paul-Lincke-Ufer', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Maybachufer', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Hasenheide', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Frankfurter Allee', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Petersburger Straße', district: 'Friedrichshain-Kreuzberg', type: 'street' },
  { name: 'Kreuzberg', district: 'Friedrichshain-Kreuzberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Friedrichshain', district: 'Friedrichshain-Kreuzberg', type: 'locality', subtitle: 'Ortsteil' },

  // --- PANKOW ---
  { name: 'Schönhauser Allee', district: 'Pankow', type: 'street' },
  { name: 'Kastanienallee', district: 'Pankow', type: 'street' },
  { name: 'Kollwitzstraße', district: 'Pankow', type: 'street' },
  { name: 'Prenzlauer Allee', district: 'Pankow', type: 'street' },
  { name: 'Danziger Straße', district: 'Pankow', type: 'street' },
  { name: 'Greifswalder Straße', district: 'Pankow', type: 'street' },
  { name: 'Bernauer Straße', district: 'Pankow', type: 'street' },
  { name: 'Eberswalder Straße', district: 'Pankow', type: 'street' },
  { name: 'Stargarder Straße', district: 'Pankow', type: 'street' },
  { name: 'Pappelallee', district: 'Pankow', type: 'street' },
  { name: 'Oderberger Straße', district: 'Pankow', type: 'street' },
  { name: 'Berliner Straße (Pankow)', district: 'Pankow', type: 'street' },
  { name: 'Breite Straße (Pankow)', district: 'Pankow', type: 'street' },
  { name: 'Dietzgenstraße', district: 'Pankow', type: 'street' },
  { name: 'Grabbeallee', district: 'Pankow', type: 'street' },
  { name: 'Prenzlauer Berg', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Weißensee', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Heinersdorf', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Karow', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Buch', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Französisch Buchholz', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Niederschönhausen', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wilhelmsruh', district: 'Pankow', type: 'locality', subtitle: 'Ortsteil' },

  // --- CHARLOTTENBURG-WILMERSDORF ---
  { name: 'Kurfürstendamm', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Kantstraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Bismarckstraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Wilmersdorfer Straße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Otto-Suhr-Allee', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Kaiserdamm', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Hardenbergstraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Uhlandstraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Fasanenstraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Bleibtreustraße', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Bundesallee', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Hohenzollerndamm', district: 'Charlottenburg-Wilmersdorf', type: 'street' },
  { name: 'Fehrbelliner Platz', district: 'Charlottenburg-Wilmersdorf', type: 'place' },
  { name: 'Charlottenburg', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wilmersdorf', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Schmargendorf', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Grunewald', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Westend', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Halensee', district: 'Charlottenburg-Wilmersdorf', type: 'locality', subtitle: 'Ortsteil' },

  // --- TEMPELHOF-SCHÖNEBERG ---
  { name: 'Hauptstraße (Schöneberg)', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Potsdamer Straße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Rheinstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Tempelhofer Damm', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Mariendorfer Damm', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Goltzstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Winterfeldtstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Akazienstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Motzstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Martin-Luther-Straße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Alboinstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Großbeerenstraße', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Lichtenrader Damm', district: 'Tempelhof-Schöneberg', type: 'street' },
  { name: 'Schöneberg', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Friedenau', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Tempelhof', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Mariendorf', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Marienfelde', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Lichtenrade', district: 'Tempelhof-Schöneberg', type: 'locality', subtitle: 'Ortsteil' },

  // --- STEGLITZ-ZEHLENDORF ---
  { name: 'Schloßstraße (Steglitz)', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Albrechtstraße', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Clayallee', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Berliner Straße (Zehlendorf)', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Teltower Damm', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Potsdamer Chaussee', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Hindenburgdamm', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Unter den Eichen', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Drakestraße', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Dahlemer Weg', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Königin-Luise-Straße', district: 'Steglitz-Zehlendorf', type: 'street' },
  { name: 'Steglitz', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Zehlendorf', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Lichterfelde', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Lankwitz', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Dahlem', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Nikolassee', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wannsee', district: 'Steglitz-Zehlendorf', type: 'locality', subtitle: 'Ortsteil' },

  // --- SPANDAU ---
  { name: 'Carl-Schurz-Straße', district: 'Spandau', type: 'street' },
  { name: 'Klosterstraße (Spandau)', district: 'Spandau', type: 'street' },
  { name: 'Seegefelder Straße', district: 'Spandau', type: 'street' },
  { name: 'Falkenseer Chaussee', district: 'Spandau', type: 'street' },
  { name: 'Neuendorfer Straße', district: 'Spandau', type: 'street' },
  { name: 'Streitstraße', district: 'Spandau', type: 'street' },
  { name: 'Pichelsdorfer Straße', district: 'Spandau', type: 'street' },
  { name: 'Brunsbütteler Damm', district: 'Spandau', type: 'street' },
  { name: 'Ruhlebener Straße', district: 'Spandau', type: 'street' },
  { name: 'Spandau', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Haselhorst', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Siemensstadt', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Staaken', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Gatow', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Kladow', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Hakenfelde', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Falkenhagener Feld', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wilhelmstadt', district: 'Spandau', type: 'locality', subtitle: 'Ortsteil' },

  // --- REINICKENDORF ---
  { name: 'Residenzstraße', district: 'Reinickendorf', type: 'street' },
  { name: 'Scharnweberstraße (Reinickendorf)', district: 'Reinickendorf', type: 'street' },
  { name: 'Ollenhauerstraße', district: 'Reinickendorf', type: 'street' },
  { name: 'Lindauer Allee', district: 'Reinickendorf', type: 'street' },
  { name: 'Holzhauser Straße', district: 'Reinickendorf', type: 'street' },
  { name: 'Eichborndamm', district: 'Reinickendorf', type: 'street' },
  { name: 'Roedernallee', district: 'Reinickendorf', type: 'street' },
  { name: 'Berliner Straße (Tegel)', district: 'Reinickendorf', type: 'street' },
  { name: 'Heiligenseestraße', district: 'Reinickendorf', type: 'street' },
  { name: 'Ruppiner Chaussee', district: 'Reinickendorf', type: 'street' },
  { name: 'Oranienburger Chaussee', district: 'Reinickendorf', type: 'street' },
  { name: 'Reinickendorf', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Tegel', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wittenau', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Hermsdorf', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Frohnau', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Waidmannslust', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Lübars', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Märkisches Viertel', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Konradshöhe', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Heiligensee', district: 'Reinickendorf', type: 'locality', subtitle: 'Ortsteil' },

  // --- TREPTOW-KÖPENICK ---
  { name: 'Puschkinallee', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Elsenstraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Karl-Kunger-Straße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Baumschulenstraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Köpenicker Landstraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Schnellerstraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Bahnhofstraße (Köpenick)', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Bölschestraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Salvador-Allende-Straße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Grünauer Straße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Wendenschloßstraße', district: 'Treptow-Köpenick', type: 'street' },
  { name: 'Alt-Treptow', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Plänterwald', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Baumschulenweg', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Johannisthal', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Niederschöneweide', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Altglienicke', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Adlershof', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Bohnsdorf', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Oberschöneweide', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Köpenick', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Friedrichshagen', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Rahnsdorf', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Müggelheim', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Schmöckwitz', district: 'Treptow-Köpenick', type: 'locality', subtitle: 'Ortsteil' },

  // --- MARZAHN-HELLERSDORF ---
  { name: 'Marzahner Promenade', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Allee der Kosmonauten', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Landsberger Allee (Marzahn)', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Hellersdorfer Straße', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Riesaer Straße', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Mehrower Allee', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Blumberger Damm', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Cecilienstraße', district: 'Marzahn-Hellersdorf', type: 'street' },
  { name: 'Marzahn', district: 'Marzahn-Hellersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Hellersdorf', district: 'Marzahn-Hellersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Biesdorf', district: 'Marzahn-Hellersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Kaulsdorf', district: 'Marzahn-Hellersdorf', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Mahlsdorf', district: 'Marzahn-Hellersdorf', type: 'locality', subtitle: 'Ortsteil' },

  // --- LICHTENBERG ---
  { name: 'Frankfurter Allee (Lichtenberg)', district: 'Lichtenberg', type: 'street' },
  { name: 'Möllendorffstraße', district: 'Lichtenberg', type: 'street' },
  { name: 'Weitlingstraße', district: 'Lichtenberg', type: 'street' },
  { name: 'Einbecker Straße', district: 'Lichtenberg', type: 'street' },
  { name: 'Herzbergstraße', district: 'Lichtenberg', type: 'street' },
  { name: 'Landsberger Allee (Lichtenberg)', district: 'Lichtenberg', type: 'street' },
  { name: 'Rhinstraße', district: 'Lichtenberg', type: 'street' },
  { name: 'Treskowallee', district: 'Lichtenberg', type: 'street' },
  { name: 'Hauptstraße (Rummelsburg)', district: 'Lichtenberg', type: 'street' },
  { name: 'Konrad-Wolf-Straße', district: 'Lichtenberg', type: 'street' },
  { name: 'Lichtenberg', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Friedrichsfelde', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Karlshorst', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Rummelsburg', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Fennpfuhl', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Alt-Hohenschönhausen', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Neu-Hohenschönhausen', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Falkenberg', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Malchow', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
  { name: 'Wartenberg', district: 'Lichtenberg', type: 'locality', subtitle: 'Ortsteil' },
];

/**
 * Searches the curated street index with case-insensitive and umlaut-tolerant matching.
 * Returns up to maxResults suggestions ordered by best relevance (prefix matches first).
 */
export function searchBerlinStreets(query: string, maxResults = 8): StreetSuggestion[] {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  // Normalize query for flexible matching (e.g. str. -> straße, ss -> ß)
  const normalizedQ = q
    .replace(/\bstr\b/g, 'straße')
    .replace(/\bstr\.\b/g, 'straße')
    .replace(/ß/g, 'ss');

  const matches: { item: StreetSuggestion; score: number }[] = [];

  for (const item of BERLIN_STREETS_INDEX) {
    const itemNameLower = item.name.toLowerCase();
    const normalizedItem = itemNameLower.replace(/ß/g, 'ss');

    // 1. Exact prefix match (highest score)
    if (itemNameLower.startsWith(q) || normalizedItem.startsWith(normalizedQ)) {
      matches.push({ item, score: 100 });
      continue;
    }

    // 2. Word boundary prefix match (e.g., "marx" matches "Karl-Marx-Straße")
    const words = itemNameLower.split(/[-–/\s]+/);
    if (words.some((w) => w.startsWith(q) || w.replace(/ß/g, 'ss').startsWith(normalizedQ))) {
      matches.push({ item, score: 75 });
      continue;
    }

    // 3. Substring match
    if (itemNameLower.includes(q) || normalizedItem.includes(normalizedQ)) {
      matches.push({ item, score: 50 });
      continue;
    }
  }

  // Sort descending by score, then alphabetically
  matches.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

  return matches.slice(0, maxResults).map((m) => m.item);
}
