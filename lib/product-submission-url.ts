/**
 * Product submitters commonly enter example.com, www.example.com or a full URL.
 * Normalize on the server, because browser validation and API clients can differ.
 */
export function normalizeProductUrl(value: string): string | null {
  const input = value.trim();
  if (!input || input.length > 2048 || /\s/.test(input) || input.startsWith('//')) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(input);
  if (!withProtocol && /^[a-z][a-z0-9+.-]*:/i.test(input)) return null;
  try {
    const url = new URL(withProtocol ? input : 'https://' + input);
    if (!['https:', 'http:'].includes(url.protocol) ||
      !url.hostname || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const parts = host.split('.');
    if (host.length > 253 || parts.length < 2 || parts.some(part =>
      part.length < 1 || part.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part)
    )) return null;
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || (!/^[a-z]{2,63}$/.test(tld) && !/^xn--[a-z0-9-]{2,59}$/.test(tld))) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}
