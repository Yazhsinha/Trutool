import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'trutool-product-test-'));
const beforeFetch=globalThis.fetch;
const previous=['RESEND_API_KEY','RESEND_FROM_EMAIL','RESEND_REPLY_TO'].map(key=>[key,process.env[key]]);
try{
 fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"commonjs"}');
 const compile=(source,dest,replace=[])=>{
  let text=fs.readFileSync(source,'utf8').replace("import 'server-only';",'');
  for(const [from,to] of replace){assert.ok(text.includes(from));text=text.replace(from,to);}
  fs.writeFileSync(path.join(tmp,dest),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
 };
 globalThis.productTestStore=new Map();
 const store=[
  'module.exports={',
  'async get(path){const record=globalThis.productTestStore.get(path);return record?{statusCode:200,stream:new Response(record.data).body,blob:{etag:record.etag}}:null;},',
  'async put(path,body,options){const record=globalThis.productTestStore.get(path);if(options.ifMatch!==record.etag)throw Error("etag conflict");globalThis.productTestStore.set(path,{data:body,etag:"2"});}',
  '};'
 ].join('\n');
 fs.writeFileSync(path.join(tmp,'storage.js'),store);
 compile('lib/product-submission-url.ts','url.js');
 compile('lib/product-submission-confirmation.ts','confirm.js',[["from './private-storage'","from './storage'"]]);
 const require=createRequire(import.meta.url);
 const {normalizeProductUrl}=require(path.join(tmp,'url.js'));
 const mail=require(path.join(tmp,'confirm.js'));
 for(const [raw,normal] of [
  ['miidasu.co','https://miidasu.co/'],['www.miidasu.co','https://www.miidasu.co/'],
  ['https://miidasu.co','https://miidasu.co/'],
  ['http://miidasu.co/tools','http://miidasu.co/tools'],
  [' miidasu.co/path ','https://miidasu.co/path']
 ])assert.equal(normalizeProductUrl(raw),normal);
 for(const raw of ['','localhost','not-a-domain','javascript:alert(1)','mailto:person@example.test','//evil.example',
  'https://user:pass@miidasu.co','https://miidasu.co bad','data:text/html,x','https://miidasu.co@other.org'])
   assert.equal(normalizeProductUrl(raw),null,'Invalid URL rejected: '+raw);
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const record={id,name:'Example <Submitter>',email:'person@example.test',topic:'suggestion',
  createdAt:'2026-10-26T06:00:00.000Z',product:{name:'A <Product>',url:'https://miidasu.co/',category:'marketing'},
  confirmationEventId:mail.productConfirmationId(id)};
 const tpl=mail.productSubmissionEmail(record);
 assert.ok(tpl.html.includes('&lt;Product&gt;')&&!tpl.html.includes('A <Product>'));
 assert.ok(tpl.text.includes('not approval or publication'));
 const key='enquiries/2026-10-26T06/key/'+id+'.json';
 globalThis.productTestStore.set(key,{data:JSON.stringify(record),etag:'1'});
 delete process.env.RESEND_API_KEY;delete process.env.RESEND_FROM_EMAIL;
 assert.equal(await mail.deliverPendingProductConfirmation(key),'pending');
 assert.equal(JSON.parse(globalThis.productTestStore.get(key).data).confirmationSentAt,undefined);
 process.env.RESEND_API_KEY='test-fake';process.env.RESEND_FROM_EMAIL='TruTool <hello@trutool.co>';
 const requests=[];
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');requests.push(options);return Response.json({id:'mock-email-id'});};
 assert.equal(await mail.deliverPendingProductConfirmation(key),'sent');
 assert.equal(requests.length,1);
 assert.equal(requests[0].headers['Idempotency-Key'],record.confirmationEventId);
 assert.equal(JSON.parse(requests[0].body).to[0],record.email);
 assert.ok(JSON.parse(globalThis.productTestStore.get(key).data).confirmationSentAt);
 assert.equal(await mail.deliverPendingProductConfirmation(key),'skipped');
 assert.equal(requests.length,1,'No second email');
 const other={...record,id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',confirmationEventId:mail.productConfirmationId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')};
 const otherKey='enquiries/2026-10-26T06/key/'+other.id+'.json';
 globalThis.productTestStore.set(otherKey,{data:JSON.stringify(other),etag:'1'});
 globalThis.fetch=async()=>Response.json({error:'rate limited'},{status:429});
 assert.equal(await mail.deliverPendingProductConfirmation(otherKey),'pending');
 assert.equal(JSON.parse(globalThis.productTestStore.get(otherKey).data).confirmationSentAt,undefined);
 const legacy={...record,confirmationEventId:undefined,id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};
 const legacyKey='enquiries/2026-10-26T06/key/'+legacy.id+'.json';
 globalThis.productTestStore.set(legacyKey,{data:JSON.stringify(legacy),etag:'1'});
 assert.equal(await mail.deliverPendingProductConfirmation(legacyKey),'skipped');
 assert.ok(fs.readFileSync('components/product-submission-form.tsx','utf8').includes('type="text" inputMode="url"'));
 assert.ok(fs.readFileSync('app/api/cron/newsletter-welcome/route.ts','utf8').includes('deliverPendingProductConfirmation'));
 console.log('PASS: domain-only URLs; formatted submission receipt; stable send idempotency; retry on provider error; legacy submissions untouched.');
}finally{
 globalThis.fetch=beforeFetch;delete globalThis.productTestStore;
 for(const [key,value] of previous){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 fs.rmSync(tmp,{recursive:true,force:true});
}
