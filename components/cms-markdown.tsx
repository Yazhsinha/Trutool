import { safeHref } from '@/lib/cms-types';
import { cmsHeadings, cmsListMarker } from '@/lib/cms-markdown-structure';
import React from 'react';

// Markdown-safe inline formatting; links are parsed before emphasis so
// [**Name**](url) becomes an accessible link with bold text, not literal stars.
function inline(value: string): React.ReactNode[] {
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|__([^_]+)__|\x60([^\x60]+)\x60|(?<!\*)\*([^*\n]+)\*(?!\*))/g;
  const result: React.ReactNode[] = [];
  let cursor = 0, n = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index;
    if (index > cursor) result.push(value.slice(cursor, index));
    if (match[2] !== undefined) {
      const url = safeHref(match[3]);
      result.push(url ? <a key={n++} href={url} {...(url.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inline(match[2])}</a> : match[0]);
    } else if (match[4] !== undefined || match[5] !== undefined) {
      result.push(<strong key={n++}>{inline(match[4] ?? match[5])}</strong>);
    } else if (match[6] !== undefined) {
      result.push(<code key={n++}>{match[6]}</code>);
    } else if (match[7] !== undefined) {
      result.push(<em key={n++}>{inline(match[7])}</em>);
    }
    cursor = index + match[0].length;
  }
  if (cursor < value.length) result.push(value.slice(cursor));
  return result;
}

const headingLine = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const fence = /^\s{0,3}(?:\x60{3}|~{3})/;
const tableDivider = /^\s*\|?\s*:?-{3,}:?\s*\|/;
const tableCells = (value: string) => value.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
const startsBlock = (value: string) => Boolean(headingLine.test(value) || fence.test(value) ||
  cmsListMarker(value) || /^\s{0,3}>/.test(value) || /^\s*\|/.test(value) || /^\s{0,3}(?:-{3,}|\*{3,})\s*$/.test(value));

export function CmsMarkdown({ body }: { body: string }) {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const headings = new Map(cmsHeadings(body).map(heading => [heading.line, heading.id]));
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], line = raw.trim();
    if (!line) continue;

    if (fence.test(raw)) {
      const code: string[] = [], opening = i;
      for (i++; i < lines.length && !fence.test(lines[i]); i++) code.push(lines[i]);
      nodes.push(<pre key={opening}><code>{code.join('\n')}</code></pre>);
      continue;
    }

    const heading = raw.match(headingLine);
    if (heading) {
      const depth = heading[1].length;
      const Heading = depth <= 2 ? 'h2' : depth === 3 ? 'h3' : 'h4';
      nodes.push(<Heading key={i} id={headings.get(i)}>{inline(heading[2])}</Heading>);
      continue;
    }

    if (/^\s*\|/.test(raw) && tableDivider.test(lines[i + 1] || '')) {
      const first = i, columns = tableCells(raw), rows: string[][] = [];
      i += 2;
      for (; i < lines.length && /^\s*\|/.test(lines[i]); i++) rows.push(tableCells(lines[i]));
      i--;
      nodes.push(<div className="cms-table-wrap" key={first}><table>
        <thead><tr>{columns.map((cell, j) => <th key={j}>{inline(cell)}</th>)}</tr></thead>
        <tbody>{rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{inline(cell)}</td>)}</tr>)}</tbody>
      </table></div>);
      continue;
    }

    const firstItem = cmsListMarker(raw);
    if (firstItem) {
      const opening = i, type = firstItem.type, items: string[] = [];
      const firstNumber = firstItem.start || 1;
      while (i < lines.length) {
        const item = cmsListMarker(lines[i]);
        if (item && item.type === type) {
          items.push(item.text);
          i++;
          continue;
        }
        // Google Docs often separates list items by blank lines.
        if (!lines[i].trim() && cmsListMarker(lines[i + 1] || '')?.type === type) {
          i++;
          continue;
        }
        break;
      }
      i--;
      const content = items.map((entry, j) => <li key={j}>{inline(entry)}</li>);
      nodes.push(type === 'ol'
        ? <ol key={opening} start={firstNumber}>{content}</ol>
        : <ul key={opening}>{content}</ul>);
      continue;
    }

    if (/^\s{0,3}>/.test(raw)) {
      const first = i, parts: string[] = [];
      for (; i < lines.length && /^\s{0,3}>/.test(lines[i]); i++) parts.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
      i--;
      nodes.push(<blockquote key={first}>{inline(parts.join(' '))}</blockquote>);
      continue;
    }

    if (/^\s{0,3}(?:-{3,}|\*{3,})\s*$/.test(raw)) {
      nodes.push(<hr key={i}/>);
      continue;
    }

    const first = i, paragraph = [raw.trim()];
    while (i + 1 < lines.length && lines[i + 1].trim() && !startsBlock(lines[i + 1])) paragraph.push(lines[++i].trim());
    nodes.push(<p key={first}>{inline(paragraph.join(' '))}</p>);
  }

  return <div className="cms-prose">{nodes}</div>;
}
