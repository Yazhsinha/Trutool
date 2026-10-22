import '@/app/styles/article.css';
import Link from '@/components/site-link';
import Image from 'next/image';
export function RfpFeaturedLinks({context}:{context:'hub'|'category'|'profile'}){
 const lead=context==='hub'?'2026 RFP SOFTWARE RESEARCH':context==='category'?'COMPARISON GUIDE · 2026':'BUYER RESEARCH · 2026';
 return <nav className="rfp-featured-links" aria-label="RFP alternatives buying guides">
  <Link href="/alternatives/loopio">{context==='hub'&&<span className="rfp-featured-art"><Image src="/covers/loopio-alternatives.svg" alt="RFP software comparison illustration" width={640} height={370} unoptimized/></span>}<span>{lead}</span><strong>8 Best Loopio Alternatives in 2026</strong><span>Inventive AI, Responsive, SiftHub and other RFP tools →</span></Link>
  <Link href="/alternatives/responsive">{context==='hub'&&<span className="rfp-featured-art"><Image src="/covers/responsive-alternatives.svg" alt="Response automation and proposal workflow illustration" width={640} height={370} unoptimized/></span>}<span>{lead}</span><strong>8 Best Responsive (RFPIO) Alternatives in 2026</strong><span>Compare AI drafting, governance and questionnaire workflows →</span></Link>
 </nav>;
}
