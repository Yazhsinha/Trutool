import type {Tool} from './catalog';
// Public presentation policy: suppress the named brand and keep its referral parameters out of public pages.
const excluded=/chatgpt/i;
export const excludedTool=(tool:Pick<Tool,'slug'|'name'>)=>excluded.test(tool.slug)||excluded.test(tool.name);
export const excludedText=(value:string)=>excluded.test(value);
const replace=(text:string)=>text.replace(/chatgpt/gi,'AI assistant');
export function publicTool(tool:Tool):Tool {
 return {...tool,summary:replace(tool.summary),fit:replace(tool.fit),caution:replace(tool.caution),
  features:tool.features.map(replace),keywords:tool.keywords?replace(tool.keywords):undefined,
  sourceTitle:tool.sourceTitle?replace(tool.sourceTitle):undefined,
  ...(tool.profile?{profile:{...tool.profile,overview:replace(tool.profile.overview),notIdeal:replace(tool.profile.notIdeal),
   useCases:tool.profile.useCases.map(replace),workflow:tool.profile.workflow.map(replace),checks:tool.profile.checks.map(replace),
   faqs:tool.profile.faqs.map(f=>({question:replace(f.question),answer:replace(f.answer)}))}}:{})};
}
