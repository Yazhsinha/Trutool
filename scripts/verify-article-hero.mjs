import assert from 'node:assert/strict';
import fs from 'node:fs';

const guide=fs.readFileSync('app/guides/[slug]/page.tsx','utf8');
const cms=fs.readFileSync('components/cms-article.tsx','utf8');
const css=fs.readFileSync('app/globals.css','utf8');

assert.ok(guide.includes('className="article-header tt-guide-header"'));
assert.ok(guide.includes('className="tt-article-hero"'));
assert.ok(guide.includes('className="tt-article-hero-copy"'));
assert.ok(guide.includes('className="tt-article-hero-media"'));
assert.ok(guide.indexOf('className="tt-article-hero-media"') < guide.indexOf('className="article-layout"'), 'Guide cover must be inside article header, not below it.');
assert.equal((guide.match(/<Image src={coverFor\(g.category\)}/g)||[]).length,1,'Each guide must show exactly one cover.');
assert.ok(guide.includes('alt={coverAlt(g.category)}'),'Guide cover alt text must remain.');

assert.ok(cms.includes('tt-cms-hero'));
assert.ok(cms.includes('tt-cms-hero-copy'));
assert.ok(cms.includes('className="cms-cover tt-article-hero-media"'));
assert.ok(cms.indexOf('className="cms-cover tt-article-hero-media"') < cms.indexOf('className="cms-article-columns"'));
assert.equal((cms.match(/<img src={c.image}/g)||[]).length,1,'CMS covers must appear only once.');
assert.ok(cms.includes('c.imageAlt?.trim() || c.title'),'CMS cover alt text must remain.');

assert.ok(css.includes('.tt-article-hero,') && css.includes('grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)'));
assert.ok(css.includes('.cms-article-heading.tt-cms-hero'));
assert.ok(css.includes('@media(max-width:760px)'), 'Phone layout must remain responsive.');
console.log('PASS: every built-in guide and CMS article uses the responsive side-by-side cover/title layout with one cover and preserved alt text.');
