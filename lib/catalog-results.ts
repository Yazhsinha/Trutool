import {discoveryMatches,orderDiscovery} from './tool-discovery';
import {normalizeDiscovery,normalizeSort} from './discovery-options';
import {isAITool} from './ai';
import {categories,tools,type Tool} from './catalog';
import {searchTools} from './search';
import {rankedCategoryTools} from './category-ranking';
import type {ToolResults} from './catalog-client';
export const categoryOptions=categories.map(({slug,short})=>({slug,short}));
export function toolResults(query='',category='',sort='relevance',page=1,limit=24,scope='',discovery='all',source?:Tool[]):ToolResults{
 query=query.trim().slice(0,160);sort=normalizeSort(sort);discovery=normalizeDiscovery(discovery);
 limit=Number.isFinite(limit)?Math.min(50,Math.max(1,Math.floor(limit))):24;
 const matches=searchTools(query,category,sort==='az'?'az':'relevance',source),found=matches.filter(t=>(scope!=='ai'||isAITool(t))&&discoveryMatches(t,discovery));
 if(sort==='newest')found.sort((a,b)=>(b.addedAt||b.launchedAt||'').localeCompare(a.addedAt||a.launchedAt||''));
 else if(!query&&sort==='relevance'){
  if(category){const known=new Set(found.map(t=>t.slug));found.splice(0,found.length,...rankedCategoryTools(category,source||tools).filter(t=>known.has(t.slug)));}
  else if(discovery!=='all')found.splice(0,found.length,...orderDiscovery(found,discovery));
 }
 const total=found.length,pages=Math.max(1,Math.ceil(total/limit));
 page=Number.isFinite(page)?Math.min(pages,Math.max(1,Math.floor(page))):1;
 return {items:found.slice((page-1)*limit,page*limit).map((t,i)=>({slug:t.slug,name:t.name,category:t.category,categoryLabel:t.categoryLabel!,summary:t.summary,format:t.format,initial:t.initial,...(!query&&category&&sort==='relevance'&&discovery==='all'?{rank:(page-1)*limit+i+1}:{})})),total,page,pages,limit,query,category,sort,discovery,...(scope==='ai'?{scope}: {})};
}
