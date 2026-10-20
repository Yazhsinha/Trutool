import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { imageConfigDefault } = require('next/dist/shared/lib/image-config.js');
const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scripts', '.performance-'));
try {
  const filename = path.join(tmp, 'cover.cjs');
  fs.writeFileSync(filename, ts.transpileModule(fs.readFileSync('components/responsive-cover.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { ResponsiveCover } = require(filename);
  const media = '/media/c5c14b7f-c906-4cdf-837d-d3d29e3e1035.webp';
  for (const src of [media, '/covers/ai.webp']) {
    const html = renderToStaticMarkup(React.createElement(ResponsiveCover, {
      src, alt: 'A useful cover', sizes: '(max-width: 760px) 90vw, 30vw', loading: 'lazy', width: 800, height: 450,
    }));
    assert.equal((html.match(/<img /g) || []).length, 1, 'A cover must render once');
    assert.ok(html.includes(`src="${src}"`), 'Preserve the original fallback URL');
    assert.ok(html.includes('srcSet=') && html.includes('sizes=') && html.includes('alt="A useful cover"'));
    const widths = [...html.matchAll(/&amp;w=(\d+)&amp;q=75/g)].map(m => Number(m[1]));
    assert.equal(widths.length, 8);
    assert.equal(new Set(widths).size, widths.length);
    assert.ok(widths.every(w => [...imageConfigDefault.deviceSizes, ...imageConfigDefault.imageSizes].includes(w)), 'Optimizer must accept every width');
  }
  for (const src of ['https://example.com/cover.webp', '//example.com/cover.webp', '/admin/preview/private.png', '/media/invalid.webp']) {
    const html = renderToStaticMarkup(React.createElement(ResponsiveCover, { src, alt: 'Cover', sizes: '100vw', loading: 'lazy' }));
    assert.ok(!html.includes('srcSet='), 'Unsupported sources must keep their original URL');
  }
  const global = fs.readFileSync('app/globals.css', 'utf8');
  assert.ok(Buffer.byteLength(global) < 145_000, 'Shared CSS budget exceeded; put page-only rules beside their views');
  for (const [sheet, selector] of [['diagnostic', '.fit-builder{'], ['about', '.about-hero-grid{'], ['article', '.cms-article{'], ['community', '.answer-tool-row{']]) {
    assert.ok(!global.includes(selector), `${sheet} styles must not return to global CSS`);
    assert.ok(fs.readFileSync(`app/styles/${sheet}.css`, 'utf8').includes(selector));
  }
  const layout = fs.readFileSync('app/layout.tsx', 'utf8');
  assert.ok(!layout.includes('/styles/'), 'Do not load page-only CSS from the root layout');
  console.log('PASS: single responsive CMS covers, valid optimizer widths, original-source fallback and shared CSS budget.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (process.argv.includes('--build')) {
  const html = fs.readFileSync('.next/server/app/index.html', 'utf8');
  const sheets = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(m => m[0]).filter(tag => tag.includes('rel="stylesheet"'))
    .map(tag => tag.match(/href="([^"]+)"/)?.[1]).filter(Boolean);
  assert.ok(sheets.length > 0, 'Homepage stylesheets must be present');
  const css = [...new Set(sheets)].map(url => fs.readFileSync('.next/' + url.split('?')[0].replace(/^\/_next\//, ''), 'utf8')).join('');
  assert.ok(Buffer.byteLength(css) < 190_000, 'Homepage CSS budget exceeded: check route-only imports');
  for (const selector of ['.fit-builder', '.about-hero-grid', '.cms-article', '.answer-tool-row']) {
    assert.ok(!css.includes(selector), 'Page-only CSS leaked into the homepage: ' + selector);
  }
  console.log(`PASS: built homepage CSS is ${Buffer.byteLength(css)} bytes and excludes unrelated page styles.`);
}
