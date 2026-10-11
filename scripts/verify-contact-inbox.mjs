import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'trutool-inbox-test-'));
const write = (file, source) => fs.writeFileSync(path.join(temp, file), source);
const compile = (source, file, replacements) => {
  let result = fs.readFileSync(source, 'utf8');
  for (const [from, to] of replacements) {
    assert.ok(result.includes(from), 'Import not found: ' + from);
    result = result.replace(from, to);
  }
  write(file, ts.transpileModule(result, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
};

try {
  const incoming = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'First person', email: 'one@example.test', topic: 'conversation', message: 'First message with enough characters.', createdAt: '2026-10-10T10:00:00.000Z' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Second person', email: 'two@example.test', topic: 'correction', message: 'A second message with enough characters.', createdAt: '2026-10-11T11:00:00.000Z' },
  ];
  write('auth.mjs', `
export async function authenticated() { return globalThis.testInboxAuth !== false; }
export function privateResponse(value, status=200) { return Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}}); }`);
  write('storage.mjs', `
export function usingSupabaseStorage() { return true; }
export async function list({prefix}) {
  if(globalThis.testInboxFailure) throw new Error('storage temporarily unavailable');
  if(prefix === 'enquiries/') return {blobs: globalThis.testInboxMessages.map((_,i)=>({pathname:'enquiries/message-'+i+'.json'})),hasMore:false};
  return {blobs:[],hasMore:false};
}
export async function get(path) {
  const i=Number(path.split('message-')[1]?.split('.')[0]);
  if(!Number.isFinite(i)) return null;
  return {statusCode:200,stream:new Response(JSON.stringify(globalThis.testInboxMessages[i])).body};
}
export async function put(path,body) { globalThis.testSubmittedPath=path;globalThis.testSubmittedRecord=JSON.parse(body);return {pathname:path}; }`);
  write('catalog.mjs', 'export const categories=[];');
  compile('app/api/admin/enquiries/route.ts', 'inbox.mjs', [
    ["from '@/lib/admin-auth'", "from './auth.mjs'"],
    ["from '@/lib/private-storage'", "from './storage.mjs'"],
  ]);
  compile('app/api/contact/route.ts', 'contact.mjs', [
    ["from '@/lib/catalog'", "from './catalog.mjs'"],
    ["from '@/lib/private-storage'", "from './storage.mjs'"],
  ]);
  globalThis.testInboxMessages = incoming;
  globalThis.testInboxAuth = false;
  const inbox = await import(pathToFileURL(path.join(temp, 'inbox.mjs')).href);
  const contact = await import(pathToFileURL(path.join(temp, 'contact.mjs')).href);
  const req = new Request('https://trutool.co/api/admin/enquiries');
  const rejected = await inbox.GET(req);
  assert.equal(rejected.status, 401, 'Inbox MUST reject unauthenticated readers.');
  assert.equal(rejected.headers.get('cache-control'), 'private, no-store');
  globalThis.testInboxAuth = true;
  const loaded = await inbox.GET(req);
  assert.equal(loaded.status, 200);
  assert.equal(loaded.headers.get('cache-control'), 'private, no-store');
  const result = await loaded.json();
  assert.equal(result.total, 2);
  assert.equal(result.messages[0].id, incoming[1].id, 'Newest messages must appear first.');
  assert.equal(result.messages[1].message, incoming[0].message, 'Full text must be preserved.');
  const exported = await inbox.GET(new Request('https://trutool.co/api/admin/enquiries?export=csv'));
  assert.equal(exported.status, 200);
  assert.ok((exported.headers.get('content-type') || '').includes('text/csv'));
  const csv = await exported.text();
  assert.ok(csv.includes(incoming[0].email) && csv.includes(incoming[1].message));
  globalThis.testInboxFailure = true;
  assert.equal((await inbox.GET(req)).status, 503);
  globalThis.testInboxFailure = false;

  const savedToken = process.env.BLOB_READ_WRITE_TOKEN;
  const savedSession = process.env.ADMIN_SESSION_SECRET;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  process.env.ADMIN_SESSION_SECRET = 'inbox-integration-test-secret';
  try {
    const post = new Request('https://trutool.co/api/contact', {
      method: 'POST',
      headers: { origin: 'https://trutool.co', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Example Visitor', email: 'visitor@example.test', topic: 'conversation', message: 'This question is long enough to be accepted.', website: '' }),
    });
    const stored = await contact.POST(post);
    assert.equal(stored.status, 200, 'Supabase-backed contact form must accept submissions without Vercel Blob token');
    assert.equal((await stored.json()).ok, true);
    assert.ok(globalThis.testSubmittedPath.startsWith('enquiries/'));
    assert.equal(globalThis.testSubmittedRecord.message, 'This question is long enough to be accepted.');
  } finally {
    if(savedToken === undefined)delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = savedToken;
    if(savedSession === undefined)delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = savedSession;
  }
  const workspace = fs.readFileSync('components/admin-workspace.tsx','utf8');
  assert.ok(workspace.includes("navigate('inbox')"), 'Private admin navigation must expose Contact inbox.');
  assert.ok(workspace.includes('<AdminEnquiryInbox/>'), 'Inbox UI must render from the Studio route.');
  console.log('PASS: public message is saved without Blob; private inbox rejects guests, loads every record, sorts newest first and exports CSV.');
} finally {
  delete globalThis.testInboxMessages;
  delete globalThis.testInboxAuth;
  delete globalThis.testInboxFailure;
  fs.rmSync(temp, { recursive: true, force: true });
}
