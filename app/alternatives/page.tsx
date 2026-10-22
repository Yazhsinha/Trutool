import {RfpFeaturedLinks} from '@/components/rfp-featured-links';
import { AlternativeBrowser } from '@/components/alternative-browser';
import Link from '@/components/site-link';
import { CmsList } from '@/components/cms-list';
import { PageStructuredData } from '@/components/page-structured-data';
import { SITE } from '@/lib/catalog';
import { categoryOptions,toolResults } from '@/lib/catalog-results';
import { publicTools } from '@/lib/cms-public';
import { pageMetadata } from '@/lib/seo';
export const revalidate=30;
export const metadata=pageMetadata({title:'Find Software Alternatives',description:'Find same-category alternatives and compare tools by workflow, fit, pricing, and trade-offs.',alternates:{canonical:SITE+'/alternatives'}});
export default async function Page(){return <main id="main" className="shell"><PageStructuredData path="/alternatives"/><div className="page-intro"><span className="eyebrow">OTHER WAYS TO GET THERE</span><h1>Explore software alternatives.</h1><RfpFeaturedLinks context="hub"/><p>Compare the top RFP alternatives below, or explore another category in the directory.</p></div><div className="page-body"><AlternativeBrowser categories={categoryOptions} initial={toolResults('','','relevance',1,24,'','all',await publicTools())}/></div><CmsList kind="alternatives" heading="Latest editorial picks"/></main>}
