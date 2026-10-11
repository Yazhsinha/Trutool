import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { loadContent } from './load-content.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trutool-site-index-'));
const content = loadContent();
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"commonjs"}');
  const compiled = ts.transpileModule(fs.readFileSync('lib/site-index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  fs.writeFileSync(path.join(tmp, 'site-index.js'), compiled);
  const require = createRequire(import.meta.url);
  const { groupSiteIndex, siteIndexPaths, siteIndexPagePath, siteIndexSections, SITE_INDEX_PAGE_SIZE } = require(path.join(tmp, 'site-index.js'));
  const pages = content.index.contentPages;
  const groups = groupSiteIndex(pages);
  const groupedPaths = groups.flatMap(group => group.pages.map(page => page.path));
  assert.equal(groupedPaths.length, pages.length, 'The HTML site index must include all canonical public pages.');
  assert.equal(new Set(groupedPaths).size, groupedPaths.length, 'No page can appear twice in the HTML index.');
  assert.deepEqual(new Set(groupedPaths), new Set(pages.map(page => page.path)), 'The HTML directory and canonical inventory must match.');
  const paths = siteIndexPaths(pages);
  assert.equal(new Set(paths).size, paths.length, 'Directory URLs must be unique.');
  assert.ok(paths.includes('/site-index'));
  for (const group of groups) {
    assert.ok(siteIndexSections.some(s => s.id === group.id));
    assert.equal(group.chunks, Math.ceil(group.count / SITE_INDEX_PAGE_SIZE));
    const listed = [];
    for (let number = 1; number <= group.chunks; number++) {
      const directoryPath = siteIndexPagePath(group.id, number);
      assert.ok(paths.includes(directoryPath), 'A directory pagination page was omitted from the sitemap: ' + directoryPath);
      listed.push(...group.pages.slice((number - 1) * SITE_INDEX_PAGE_SIZE, number * SITE_INDEX_PAGE_SIZE));
    }
    assert.equal(listed.length, group.count);
  }
  for (const path of paths) assert.ok(!path.startsWith('/admin') && !path.startsWith('/api/'));
  assert.ok(fs.readFileSync('app/sitemap.ts', 'utf8').includes('...siteIndexPaths(pages)'));
  assert.ok(fs.readFileSync('components/shell.tsx', 'utf8').includes('href="/site-index"'));
  for (const source of ['app/site-index/page.tsx', 'app/site-index/[section]/[page]/page.tsx'])
    assert.ok(fs.readFileSync(source, 'utf8').includes('BreadcrumbList'), 'Missing structured-data breadcrumbs: ' + source);
  console.log('PASS: ' + pages.length + ' canonical URLs covered exactly once by paginated HTML discovery links; ' + paths.length + ' site index URLs added to the sitemap, each section has breadcrumbs.');
} finally {
  content.cleanup();
  fs.rmSync(tmp, { recursive: true, force: true });
}
