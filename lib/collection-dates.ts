import {modifiedFor,type ContentPage} from './content-index';

// publicPages supplies only published, visible records. CMS dates are recorded
// on publication/edit, never inferred from the request or deployment clock.
export function withCollectionDates(pages:ContentPage[]):ContentPage[]{
 const revisions=new Map<string,string>();
 const record=(path:string,date:string)=>{const previous=revisions.get(path);if(!previous||Date.parse(date)>Date.parse(previous))revisions.set(path,date);};
 const archives:Record<string,string>={guide:'/guides',tool:'/tools',answer:'/community',comparison:'/compare',alternatives:'/alternatives',service:'/services',author:'/authors',news:'/everything-ai'};
 for(const page of pages){
  const cms=page.cms,date=cms&&modifiedFor(page);
  if(!cms||!date)continue;
  if(archives[cms.kind])record(archives[cms.kind],date);
  if(['guide','tool','news'].includes(cms.kind))record('',date);
  if(cms.kind==='tool'&&(page.tool?.ai||cms.category.startsWith('ai')))record('/everything-ai',date);
  if(cms.category&&['guide','tool'].includes(cms.kind))record('/categories/'+cms.category,date);
  if(cms.authorSlug)record('/authors/'+cms.authorSlug,date);
 }
 return pages.map(page=>{
  const revision=revisions.get(page.path),own=modifiedFor(page);
  return revision&&(!own||Date.parse(revision)>Date.parse(own))?{...page,updatedAt:revision}:page;
 });
}
