import Link from '@/components/site-link';
export function RfpFeaturedLinks({context}:{context:'hub'|'category'|'profile'}){
 const lead=context==='hub'?'2026 RFP SOFTWARE RESEARCH':context==='category'?'COMPARISON GUIDE · 2026':'BUYER RESEARCH · 2026';
 return <nav className="rfp-featured-links" aria-label="RFP alternatives buying guides">
  <Link href="/alternatives/loopio"><span>{lead}</span><strong>8 best Loopio alternatives</strong><span>Inventive AI, Responsive, SiftHub and other RFP tools →</span></Link>
  <Link href="/alternatives/responsive"><span>{lead}</span><strong>8 best Responsive (RFPIO) alternatives</strong><span>Compare AI drafting, governance and questionnaire workflows →</span></Link>
 </nav>;
}
