/**
 * Phone number sanitization utilities for Polaris
 * Ensures a single, clean central hotline is displayed and dialed.
 */

export function getPrimaryPhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';

  // Remove prefixes like "Tel:", "Telefon:", "Tel.:"
  let cleaned = rawPhone.replace(/^tel(\.|efon)?:\s*/i, '').trim();

  // Split multi-number strings separated by semicolon, comma, slash, pipe or 'oder'
  const parts = cleaned
    .split(/;|\/|\||\n|(?<=\d)\s*,\s*(?=\d)|(?<=\))\s*,\s*(?=\d)|\s+oder\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  // If multiple numbers exist, prefer a landline (030 / 115) over mobile (015x, 016x, 017x)
  const landline = parts.find((p) => {
    const compact = p.replace(/[\s()-]/g, '');
    return compact.startsWith('030') || compact.startsWith('115') || compact.startsWith('+4930');
  });

  return landline || parts[0];
}

export function getCleanTelUri(rawPhone?: string | null): string {
  const primary = getPrimaryPhoneNumber(rawPhone);
  if (!primary) return '';

  // Strip all whitespace and punctuation except leading +
  const digits = primary.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}
