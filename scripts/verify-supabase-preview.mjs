// Preview-only one-time Supabase read/write smoke test; contains no credentials.
import { randomUUID } from 'node:crypto';
const url=process.env.SUPABASE_URL;
const secret=process.env.SUPABASE_SECRET_KEY;
if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='fix/trutool-supabase-storage'){
  console.log('Supabase preview smoke test skipped outside migration preview.');
  process.exit(0);
}
if(process.env.TRUTOOL_STORAGE_BACKEND!=='supabase')throw new Error('Preview storage flag missing');
if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!secret)throw new Error('Supabase env config missing');
const headers={apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'};
async function call(path,options={}){
  const response=await fetch(url+path,{...options,headers,cache:'no-store'});
  if(!response.ok)throw new Error('Supabase storage smoke: '+path.split('?')[0]+' HTTP '+response.status);
  return response;
}
const testPath='cms/security/smoke-'+randomUUID()+'.json';
await call('/rest/v1/trutool_objects?select=path&limit=1');
const created=await (await call('/rest/v1/rpc/trutool_write_object',{method:'POST',body:JSON.stringify({p_path:testPath,p_payload:{data:{test:true},contentType:'application/json'},p_if_match:null})})).json();
if(!created.ok||!created.etag)throw new Error('Supabase write transaction failed');
const results=await(await call('/rest/v1/trutool_objects?select=payload%2Cetag&path=eq.'+encodeURIComponent(testPath))).json();
if(results.length!==1||results[0].etag!==created.etag)throw new Error('Supabase write/read mismatch');
const removed=await call('/rest/v1/trutool_objects?path=eq.'+encodeURIComponent(testPath),{method:'DELETE'});
console.log('PASS: TruTool Supabase preview credentials, private record write/read and cleanup.');
