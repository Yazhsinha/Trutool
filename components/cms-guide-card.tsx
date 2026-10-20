import { ResponsiveCover } from './responsive-cover';
import { authorFor } from '@/lib/authors';
import { categoryOf } from '@/lib/catalog';
import { coverFor, coverAlt } from '@/lib/covers';
import { contentPath, type CmsContent } from '@/lib/cms-types';
import Link from '@/components/site-link';
import { MotionSymbol } from './motion-symbol';

export function CmsGuideCard({ guide }: { guide: CmsContent }) {
  const author = authorFor({ category: guide.category, authorSlug: guide.authorSlug });
  return <Link className="guide-card" href={contentPath(guide)}>
    <div className="guide-art"><ResponsiveCover src={guide.image || coverFor(guide.category)} alt={guide.image ? guide.imageAlt || guide.title + ' cover image' : coverAlt(guide.category)} width={800} height={450} sizes="(max-width: 540px) calc(100vw - 40px), (max-width: 900px) 46vw, (max-width: 1399px) 30vw, 23vw" loading="lazy"/></div>
    <div className="guide-card-copy">
      <span className="eyebrow">{categoryOf(guide.category).short}</span>
      <h3>{guide.title}</h3>
      <span className="read-label">By {guide.authorName || author.name} · Editorial buying guide</span>
      <span className="guide-read">Read the guide <MotionSymbol kind="arrow" size={17}/></span>
    </div>
  </Link>;
}
