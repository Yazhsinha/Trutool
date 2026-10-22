import Image from 'next/image';
import Link from '@/components/site-link';
import {featuredAlternatives} from '@/lib/featured-alternatives';
import '@/app/styles/article.css';
export async function FeaturedAlternatives(){
 const items=await featuredAlternatives();
 if(!items.length)return null;
 return <section className="featured-alt-section" aria-label="Featured alternatives">
  <div className="featured-alt-section-head">
   <div><span className="eyebrow">EDITOR'S PICKS</span><h2>Featured Alternatives</h2>
   <p>Handpicked comparisons worth exploring, updated as new guides are published.</p></div>
   <span>{items.length} featured {items.length===1?'guide':'guides'}</span>
  </div>
  <div className="rfp-featured-links featured-alt-grid">
   {items.map(item=><Link key={item.slug} href={item.path} className="featured-alt-card">
    <span className="rfp-featured-art"><Image src={item.image} alt={item.imageAlt} width={800} height={450} unoptimized/></span>
    <span className="featured-alt-kicker">FEATURED COMPARISON</span>
    <strong>{item.title}</strong>
    <span className="featured-alt-description">{item.description}</span>
    <span className="featured-alt-read">Read comparison <span aria-hidden="true">↗</span></span>
   </Link>)}
  </div>
 </section>;
}
