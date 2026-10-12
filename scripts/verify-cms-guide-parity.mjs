import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scripts', '.cms-parity-'));
const require = createRequire(import.meta.url);
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"commonjs"}');
  const transpile = (source, filename, replacements = []) => {
    let code = fs.readFileSync(source, 'utf8');
    for (const [from, to] of replacements) {
      assert.ok(code.includes(from), 'Missing test import: ' + from);
      code = code.replace(from, to);
    }
    fs.writeFileSync(path.join(tmp, filename), ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText);
  };
  transpile('lib/cms-types.ts', 'cms-types.cjs');
  transpile('lib/cms-markdown-structure.ts', 'cms-structure.cjs');
  transpile('components/cms-markdown.tsx', 'cms-markdown.cjs', [
    ["from '@/lib/cms-types'", "from './cms-types.cjs'"],
    ["from '@/lib/cms-markdown-structure'", "from './cms-structure.cjs'"],
  ]);
  const { cmsHeadings, cmsListMarker } = require(path.join(tmp, 'cms-structure.cjs'));
  const { CmsMarkdown } = require(path.join(tmp, 'cms-markdown.cjs'));
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');

  const body = [
    'Healthcare listings help patients find the right location.',
    '',
    '## **Key takeaways**',
    '',
    '• Keep location data correct.',
    '',
    '• Review publisher changes.',
    '',
    '## **Best tools**',
    '',
    '| Platform | Why it matters |',
    '| --- | --- |',
    '| [**Synup**](https://synup.com) | Location data and approvals |',
    '| [**Yext**](https://www.yext.com) | Enterprise listing controls |',
    '',
    '## Review stages',
    '',
    '1) Check current records',
    '',
    '2) Confirm corrections',
    '',
    '3) Audit public listings',
    '',
    '## Review stages',
    '',
    '- **Ownership:** Keep changes governed',
    '- [**Google guidance**](https://support.google.com/business/answer/3038177)',
  ].join('\n');
  const headingItems = cmsHeadings(body);
  assert.deepEqual(headingItems.map(h => h.id), ['key-takeaways','best-tools','review-stages','review-stages-2']);
  assert.equal(cmsListMarker('• Important').type, 'ul');
  assert.equal(cmsListMarker('2) Numbered item').start, 2);
  const html = renderToStaticMarkup(React.createElement(CmsMarkdown, { body }));
  assert.ok(html.includes('id="key-takeaways"') && html.includes('id="review-stages-2"'));
  assert.ok(html.includes('<ul><li>Keep location data correct.</li><li>Review publisher changes.</li></ul>'), 'Unicode bullets must group into a list across blank lines');
  assert.match(html, /<ol(?: start="1")?><li>Check current records<\/li><li>Confirm corrections<\/li><li>Audit public listings<\/li><\/ol>/, 'Numbered steps must be sequential real list elements');
  assert.ok(html.includes('<a href="https://synup.com/" target="_blank" rel="noopener noreferrer"><strong>Synup</strong></a>'), 'Markdown bold inside links must not show asterisks');
  assert.ok(!html.includes('**'), 'No raw bold markdown residue should appear in rendered HTML');
  assert.ok(html.includes('<table>') && html.includes('<tbody>'), 'Tables must be semantic');

  const article = fs.readFileSync('components/cms-article.tsx', 'utf8');
  const guides = fs.readFileSync('app/guides/page.tsx', 'utf8');
  const home = fs.readFileSync('app/page.tsx', 'utf8');
  const sitemap = fs.readFileSync('app/sitemap.ts', 'utf8');
  const category = fs.readFileSync('app/categories/[slug]/page.tsx', 'utf8');
  const index = fs.readFileSync('app/site-index/[section]/[page]/page.tsx', 'utf8');
  assert.ok(article.includes('isGuide ? <>') && article.includes('<ArticleToc items={toc}/>'), 'CMS guides must use the standard clickable TOC');
  assert.ok(article.includes('<AuthorProfile author={author} compact/>') && article.includes('<AuthorProfile author={author}/>'), 'Both author contexts must render');
  assert.ok(article.includes('className="tldr"') && article.includes('className="tt-article-hero-media"'), 'CMS guide must show TLDR and cover in header');
  const cmsGuideHeader = article.split('{isGuide ? <>')[1]?.split('</header>')[0] || '';
  assert.ok(cmsGuideHeader.includes('<h1>{c.title}</h1>'), 'CMS guide title must remain');
  assert.ok(cmsGuideHeader.includes('<p>{c.description}</p>'), 'CMS guide must preserve answer-first summary in its TLDR');
  assert.ok(!cmsGuideHeader.includes('className="article-deck"'), 'Do not repeat the answer-first summary beneath the CMS guide title');
  const toc = fs.readFileSync('components/article-toc.tsx', 'utf8');
  const css = fs.readFileSync('app/globals.css', 'utf8');
  assert.ok(toc.includes("data-section-id={item.id}") && toc.includes('nav.scrollTo('), 'TOC must scroll its own panel to the active heading');
  assert.ok(toc.includes("window.addEventListener('scroll', queue"), 'TOC must follow the reader while scrolling');
  assert.ok(css.includes('max-height:calc(100dvh - 112px)') && css.includes('overflow-y:auto'), 'Desktop TOC must stay inside viewport and remain scrollable');
  assert.ok(css.includes('overflow-x:auto') && css.includes('overflow-y:hidden'), 'Phone TOC remains horizontal and scrollable');
  assert.ok(guides.includes('<CmsGuideCard') && guides.includes('<GuideCard') && !guides.includes('<CmsList'), 'Built-in and published guides must be in one grid');
  assert.ok(home.includes('homeGuides.map(') && home.includes('<CmsGuideCard'), 'Homepage must feature newly published guides');
  assert.ok(sitemap.includes("dynamic='force-dynamic'") && sitemap.includes('publicPages()'), 'Sitemap must incorporate current published CMS URLs');
  assert.ok(category.includes("getPublished()") && category.includes("item.kind==='guide'&&item.category===slug") && category.includes("href={'/guides/'+item.slug}"), 'Every CMS guide must gain a relevant category referring page automatically');
  assert.ok(index.includes('groupSiteIndex(await publicPages())') && index.includes('href={item.path ||'), 'All published CMS URLs must remain linked from HTML site index');
  console.log('PASS: CMS guide hero, TOC, author, unified cards, fresh sitemap, Unicode bullets, table links, numbering and inline Markdown.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
