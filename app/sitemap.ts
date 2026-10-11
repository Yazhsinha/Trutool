import { publicPages } from '@/lib/cms-public';
import { absolute,modifiedFor } from '@/lib/content-index';
import { coverFor } from '@/lib/covers';
import { siteIndexPaths } from '@/lib/site-index';
import type { MetadataRoute } from 'next';
export const revalidate=30;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const pages=await publicPages();return [...pages.map(page=>({url:absolute(page.path||'/'),...(modifiedFor(page)?{lastModified:modifiedFor(page)}:{}),...(page.cms?.image?{images:[/^https:\/\//.test(page.cms.image)?page.cms.image:absolute(page.cms.image)]}:page.guide?{images:[absolute(coverFor(page.guide.category))]}:{}),priority:page.path===''?1:page.kind==='tool'?.8:.6})),...siteIndexPaths(pages).map(path=>({url:absolute(path)}))]}
