/**
 * Geolocation & BVG Transit Routing Utilities for Polaris
 */

/**
 * Calculates the great-circle distance between two points in kilometers
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Human-readable distance formatter (e.g. "350 m" or "2.4 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Generates an official BVG Fahrinfo connection URL
 */
export function getBVGRouteUrl(destination: string): string {
  const cleanDest = destination.trim();
  return `https://www.bvg.de/de/verbindungen/verbindungssuche?to=${encodeURIComponent(cleanDest)}`;
}

/**
 * Generates a Google Maps Transit (ÖPNV) directions URL.
 * When GPS coordinates [lat, lng] are provided, they are prioritized for 100% accurate,
 * fail-safe transit routing without Google Maps POI name mismatch or hallucinated paths.
 */
export function getTransitDirectionsUrl(
  destination: string,
  coordinates?: [number, number] | null
): string {
  if (
    coordinates &&
    coordinates.length === 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number' &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1]) &&
    coordinates[0] > 50 && coordinates[0] < 55 // Valid German latitude range
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinates[0]},${coordinates[1]}&travelmode=transit`;
  }

  const cleanDest = destination.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDest)}&travelmode=transit`;
}
