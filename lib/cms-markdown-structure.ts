// Shared pure parsing rules for CMS article headings and list markers.
export type CmsHeading = { line: number; level: number; id: string; label: string };
export type CmsListMarker = { type: 'ol' | 'ul'; text: string; start?: number };

export const cmsImageFallbackSize = { width: 1600, height: 900 };

// Pixel size from a Markdown title ("1600x900") or trailing attributes
// ({width=1600 height=900}). Anything else keeps the 16:9 editorial default
// so the image still reserves space.
export function cmsImageDimensions(hint?: string) {
  const text = hint || '';
  const pair = text.match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/i);
  const width = pair?.[1] ?? text.match(/\bwidth\s*=\s*"?(\d{2,5})/i)?.[1];
  const height = pair?.[2] ?? text.match(/\bheight\s*=\s*"?(\d{2,5})/i)?.[1];
  if (!width || !height) return cmsImageFallbackSize;
  const limit = (value: string) => Math.min(8000, Math.max(1, Math.round(Number(value))));
  return { width: limit(width), height: limit(height) };
}

export function cmsStandaloneImage(line: string) {
  const match = line.match(/^\s{0,3}!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)(?:\{([^}]*)\})?\s*$/);
  if (!match) return;
  return { alt: match[1], src: match[2], hint: [match[3], match[4]].filter(Boolean).join(' ') };
}

export function cmsListMarker(line: string): CmsListMarker | undefined {
  const numbered = line.match(/^\s{0,3}(\d{1,4})[.)]\s+(.+)$/);
  if (numbered) return { type: 'ol', start: Number(numbered[1]), text: numbered[2] };
  const bullet = line.match(/^\s{0,3}(?:[-*+]|[•●▪‣–])\s+(.+)$/);
  if (bullet) return { type: 'ul', text: bullet[1] };
  return undefined;
}

export function cmsPlainText(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[*_~\x60#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cmsHeadings(body: string): CmsHeading[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const ids = new Map<string, number>();
  const result: CmsHeading[] = [];
  let code = false;
  lines.forEach((line, index) => {
    if (/^\s{0,3}(?:\x60{3}|~{3})/.test(line)) { code = !code; return; }
    if (code) return;
    const match = line.match(/^\s{0,3}(#{2,4})\s+(.+?)\s*#*\s*$/);
    if (!match) return;
    const label = cmsPlainText(match[2]);
    if (!label) return;
    const base = label.normalize('NFKD').toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    const seen = ids.get(base) || 0;
    ids.set(base, seen + 1);
    result.push({ line: index, level: match[1].length, label, id: seen ? base + '-' + (seen + 1) : base });
  });
  return result;
}
