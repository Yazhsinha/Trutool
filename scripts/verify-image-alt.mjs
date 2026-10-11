import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

let inspected = 0;
const failures = [];
const targetRoots = ['app', 'components'];
function walk(directory) {
 for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
  const filename = path.join(directory, entry.name);
  if (entry.isDirectory()) { walk(filename); continue; }
  if (!/\.(tsx|jsx)$/.test(filename)) continue;
  const source = fs.readFileSync(filename, 'utf8');
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
   if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
    const tagName = node.tagName.getText(file);
    const isImage = tagName === 'img' || (tagName === 'Image' && source.includes("next/image"));
    if (isImage) {
     inspected++;
     const alt = node.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === 'alt');
     const position = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
     if (!alt || !ts.isJsxAttribute(alt) || !alt.initializer) failures.push(filename + ':' + position + ' missing alt');
     else if (ts.isStringLiteral(alt.initializer) && !alt.initializer.text.trim()) failures.push(filename + ':' + position + ' empty alt');
    }
   }
   ts.forEachChild(node, visit);
  }
  visit(file);
 }
}
for (const directory of targetRoots) walk(directory);
assert.ok(inspected > 10, 'Image alt check unexpectedly inspected too few images');
assert.deepEqual(failures, [], 'Every img / next/image element must include a non-empty descriptive alt attribute.');
const toolLogo = fs.readFileSync('components/tool-logo.tsx', 'utf8');
assert.ok(toolLogo.includes('alt={name + " logo"}'), 'Shared tool logo must use its actual brand name in alt.');
const cms = fs.readFileSync('components/cms-article.tsx', 'utf8');
assert.ok(cms.includes('c.imageAlt?.trim() || c.title'), 'CMS cover images need a descriptive fallback.');
console.log('PASS: ' + inspected + ' JSX image usages include non-empty alt text; shared tool logos and CMS covers have descriptive fallbacks.');
