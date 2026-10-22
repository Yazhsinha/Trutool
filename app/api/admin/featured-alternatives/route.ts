import {authenticated,privateResponse,sameOrigin} from '@/lib/admin-auth';
import {readStore,writeStore} from '@/lib/cms-store';
import {availableFeaturedAlternatives,defaultFeaturedAlternatives,maxFeaturedAlternatives} from '@/lib/featured-alternatives';
import {BlobPreconditionFailedError} from '@/lib/private-storage';
import {revalidatePath,revalidateTag} from 'next/cache';
import type {CmsStore} from '@/lib/cms-types';
export const dynamic='force-dynamic';
const display=(store:CmsStore)=>({
 available:availableFeaturedAlternatives(store).map(({slug,title,path,source})=>({slug,title,path,source})),
 featured:store.featuredAlternativeSlugs??defaultFeaturedAlternatives
});
export async function GET(){
 if(!await authenticated())return privateResponse({error:'Please sign in.'},401);
 try{return privateResponse(display((await readStore()).store))}
 catch{return privateResponse({error:'Featured alternatives could not be loaded.'},503)}
}
export async function POST(request:Request){
 if(!await authenticated())return privateResponse({error:'Please sign in.'},401);
 if(!sameOrigin(request))return privateResponse({error:'Invalid origin.'},403);
 try{
  const raw=await request.text();
  if(raw.length>1800)return privateResponse({error:'Too many featured alternatives.'},413);
  const parsed=JSON.parse(raw) as {slugs?:unknown};
  if(!Array.isArray(parsed.slugs)||parsed.slugs.length>maxFeaturedAlternatives||
     parsed.slugs.some(x=>typeof x!=='string'||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x))||x.length>120)||
     new Set(parsed.slugs).size!==parsed.slugs.length)
   return privateResponse({error:'Choose up to 12 distinct published alternatives.'},400);
  const {store,etag}=await readStore();
  const allowed=new Set(availableFeaturedAlternatives(store).map(x=>x.slug));
  if(parsed.slugs.some(x=>!allowed.has(x)))return privateResponse({error:'One or more alternatives are not published.'},400);
  store.featuredAlternativeSlugs=parsed.slugs as string[];
  store.revision++;
  store.activity=[{at:new Date().toISOString(),title:'Featured alternatives',action:'reorder'},...store.activity].slice(0,200);
  await writeStore(store,etag);
  revalidateTag('cms',{expire:0});
  revalidatePath('/alternatives');
  return privateResponse(display(store));
 }catch(e){
  if(e instanceof BlobPreconditionFailedError)return privateResponse({error:'Another editor updated the featured list. Reload before saving.'},409);
  return privateResponse({error:'Featured alternatives could not be saved.'},503);
 }
}
