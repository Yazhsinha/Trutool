import type {Tool} from './catalog';
import {normalizeDiscovery} from './discovery-options';
// Curated discovery collections, independent of search relevance and user ratings.
const popular=new Set(['claude-code','github-copilot','claude','gemini','kimi','qwen-chat','le-chat','harvey','legora','spellbook','cocounsel','heidi-health','abridge','nabla','deepseek','grok','perplexity','cursor','notebooklm','gamma','figma','canva','adobe-photoshop','notion','obsidian','slack','microsoft-teams','zoom','google-meet','loom','discord','asana','trello','clickup','monday-com','linear','miro','zapier','make','n8n','hubspot','salesforce','mailchimp','semrush','ahrefs','wordpress','webflow','shopify','wix','squarespace','framer','bubble','lovable','bolt','replit','vscode','airtable','google-workspace','microsoft-365','dropbox','1password','bitwarden','coursera','udemy','edx','duolingo','grammarly','otter','fireflies','elevenlabs','midjourney','runway','suno','descript','capcut','dall-e','leonardo-ai']);
const practical=new Set([...popular,'synup','brightlocal','inventive-ai','loopio','qorusdocs','bardeen','reclaim','motion','elicit','scispace','researchrabbit','granola','napkin-ai','wispr-flow','undermind','exa','jev-ai','tally','cal-com','calendly','readwise','raindrop-io','todoist','ticktick','fathom','fathom-ai','fellow','sunsama','rescue-time','remove-bg','screaming-frog','postman','dbeaver','supabase','appwrite','cloudflare','vercel','netlify','sentry','plausible','umami','matomo','buffer','beehiiv','kit','brevo','ghost','typeform','jotform','coda','confluence','glean','dify','flowise','langflow','ollama','lm-studio','hermes-agent','clinicalkey-ai','glass-health','evidencehunt','heidi-health','nabla','freed','spellbook','cocounsel','genie-ai','legalon','alexi','paxton','draftwise','inventree','documenso','archivebox']);
const niche=new Set(['undermind','napkin-ai','wispr-flow','granola','exa','jev-ai','elicit','researchrabbit','scispace','consensus','khoj','mem','reclaim','sunsama','raindrop-io','readwise','tally','cal-com','tldraw','penpot','excalidraw','spline','rive','dbeaver','appwrite','turso','pocketbase','umami','plausible','matomo','screaming-frog','bardeen','n8n','dify','flowise','langflow','ollama','lm-studio','browser-use','crewai','langgraph','open-webui','comfyui','aider','continue','tabby','vapi','retell-ai','bland-ai','falcon-ocr-arabic','autorfp-ai','sifthub','qorusdocs','hermes-agent','evidencehunt','glass-health','draftwise','alexi','paxton','lawdroid','elia','agentup','screenpipe','aios','documenso','archivebox','inventree','tali-ai','scribeberry']);
export function discoveryMatches(tool:Pick<Tool,'slug'>,mode:string){const lens=normalizeDiscovery(mode);return lens==='all'||(lens==='popular'?popular:lens==='useful'?practical:niche).has(tool.slug)}

/** Editorial ordering is informed by independently published adoption signals and category fit.
 * It is not presented as measured TruTool traffic or a customer-rating leaderboard.
 * The text relevance engine still wins whenever somebody enters a search query.
 */
const priorities:Record<'popular'|'useful'|'niche',string[]>={
 popular:['claude-code','github-copilot','cursor','claude','gemini','perplexity','notion','figma','canva','microsoft-teams','slack','zoom','github-copilot','linear','zapier','hubspot','salesforce','semrush','ahrefs','midjourney','elevenlabs','runway','suno','shopify','wordpress','webflow','notebooklm','lovable','replit','deepseek','1password','bitwarden','loopio'],
 useful:['notion','cursor','github-copilot','claude-code','perplexity','figma','canva','linear','zapier','notebooklm','gamma','calendly','bitwarden','granola','fathom','screaming-frog','postman','supabase','cloudflare','semrush','brightlocal','synup','inventive-ai','loopio','qorusdocs'],
 niche:['undermind','exa','wispr-flow','napkin-ai','granola','sifthub','autorfp-ai','qorusdocs','tally','cal-com','researchrabbit','readwise','dbeaver','n8n','crewai','browser-use','penpot','plausible','vapi']
};
export function orderDiscovery<T extends Pick<Tool,'slug'>>(items:T[],mode:string):T[]{
 const lens=normalizeDiscovery(mode);if(lens==='all')return items;
 const order=priorities[lens],index=new Map(order.map((slug,i)=>[slug,i]));
 return [...items].sort((a,b)=>(index.get(a.slug)??10000)-(index.get(b.slug)??10000));
}
