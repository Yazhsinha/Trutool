// Optional CMS JSON-LD. Empty is valid. A stored value must be one JSON
// object or an array, then emitted with "<" escaped so it cannot break out of
// a script tag.
export type CmsJsonLdParsed = { ok: true; value?: unknown } | { ok: false; error: string };

export function parseCmsJsonLd(input: string | undefined | null): CmsJsonLdParsed {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return { ok: true };
  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Structured data must be valid JSON. Paste one JSON object, or an array of objects.' };
  }
  if (value === null || typeof value !== 'object') {
    return { ok: false, error: 'Structured data must be a JSON object or an array, not a string, number, or other value.' };
  }
  return { ok: true, value };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function cmsJsonLdMarkup(input: string | undefined | null) {
  const parsed = parseCmsJsonLd(input);
  if (!parsed.ok || parsed.value === undefined) return null;
  return serializeJsonLd(parsed.value);
}
