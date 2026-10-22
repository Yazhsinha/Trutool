import {categories,tools,type Tool} from './catalog';
import type {DirectoryTool} from './catalog-client';
const related=new Set(['lovable','bolt','gamma','beautiful-ai','lindy','relevance-ai','bardeen','elicit','otter','fireflies','granola','mem','reclaim','motion','researchrabbit','zed']);
export const isAITool=(tool:Pick<Tool,'slug'|'category'|'ai'>)=>Boolean(tool.ai||tool.category==='ai'||tool.category.startsWith('ai-')||related.has(tool.slug));
export const aiTools=tools.filter(isAITool);
export const aiCategories=categories.filter(c=>c.slug==='ai'||c.slug.startsWith('ai-'));
export const aiStats={tools:aiTools.length,categories:aiCategories.length};
export type AIShelfTool=DirectoryTool&{useCase:string;launchedAt?:string;launchStatus?:string;externalUrl?:string};
const useCases:Record<string,string>={
 claude:'Write, analyze documents, and build with code.',perplexity:'Research a question with links to sources.',cursor:'Work on a codebase with AI in your editor.',notebooklm:'Ask questions grounded in your own sources.',gamma:'Turn an outline into a presentation.',
 undermind:'Find scientific papers beyond keyword matches.','napkin-ai':'Turn an explanation into a clear diagram.','wispr-flow':'Dictate naturally across your everyday apps.',granola:'Capture meeting notes without starting from scratch.',exa:'Give an agent search over live web content.','jev-ai':'Classify and route decisions with probabilities.',
 'reflection-beam':'Explore a new coding and reasoning model.','meta-muse':'Delegate personal projects across connected apps.','claude-sonnet-5-5':'Try a new model for coding and knowledge work.','falcon-ocr-arabic':'Extract Arabic text and tables from scans.'
};
export function compactAI(slugs:string[]):AIShelfTool[]{return slugs.map(slug=>aiTools.find(t=>t.slug===slug)).filter((t):t is Tool=>Boolean(t)).map(({slug,name,category,categoryLabel,summary,format,initial,launchedAt,launchStatus})=>({slug,name,category,categoryLabel:categoryLabel!,summary,format,initial,useCase:useCases[slug]||summary,...(launchedAt?{launchedAt,launchStatus}:{})}));}
export function freshAITools(now=Date.now()){return aiTools.filter(t=>!t.name.toLowerCase().includes('chatgpt')&&t.launchedAt&&Date.parse(t.launchedAt)<=now&&Date.parse(t.launchedAt)>=now-45*86400000).sort((a,b)=>b.launchedAt!.localeCompare(a.launchedAt!)).slice(0,6)}
const favorites=['claude','perplexity','cursor','github-copilot','notebooklm','gamma'];
const specialists=['undermind','napkin-ai','wispr-flow','granola','exa','jev-ai'];
export function getAIShelves(now=Date.now(),discovered:AIShelfTool[]=[]){
 const fresh=compactAI(freshAITools(now).map(t=>t.slug));
 const seen=new Set<string>();
 const newOnMarket=[...discovered,...fresh].filter(t=>{
  if(!t.launchedAt||seen.has(t.slug)||Date.parse(t.launchedAt)>now)return false;
  seen.add(t.slug);
  return true;
 }).slice(0,6);
 const specialistsNew=aiTools.filter(t=>specialists.includes(t.slug)&&t.addedAt&&Date.parse(t.addedAt)<=now).sort((a,b)=>(b.addedAt||'').localeCompare(a.addedAt||''));
 const specialistSlugs=[...specialists.filter(s=>specialistsNew.some(t=>t.slug===s)),...specialists].filter((s,i,a)=>a.indexOf(s)===i).slice(0,6);
 return [
  {id:'popular',label:'Familiar favourites',description:'Established, recognisable tools selected for different real-world tasks. Not a user-count ranking.',tools:compactAI(favorites)},
  {id:'added',label:'Just added',description:discovered.length?'Newly posted AI launches from Product Hunt, with source dates. External cards are discoveries, not vetted TruTool profiles.':'Recent dated releases already in the directory. Launch-feed discoveries return automatically when the public source is available.',tools:newOnMarket},
  {id:'specialist',label:'Under the radar',description:'Specialist picks for narrower workflows; no artificial ratings or popularity claims.',tools:compactAI(specialistSlugs)}
 ];
}
export const aiShelves=getAIShelves();
