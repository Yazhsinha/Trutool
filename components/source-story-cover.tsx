'use client';

import Image from 'next/image';
import { Newspaper, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

type SourceStoryCoverProps = {
  src?: string;
  title: string;
  publisher: string;
};

/**
 * The source feeds select the image and the story. Loading the original image
 * bypasses Next's image optimizer, which some news publishers block.
 * If the publisher removes or blocks the cover, keep the article and its link
 * visible with a source-specific fallback instead of a broken image icon.
 */
export function SourceStoryCover({ src, title, publisher }: SourceStoryCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (src && failedSrc !== src) {
    return <Image
      src={src}
      alt={title + ' — original article cover from ' + publisher}
      fill
      sizes="(max-width: 760px) 90vw, (max-width: 1100px) 45vw, 30vw"
      unoptimized
      onError={() => setFailedSrc(src)}
    />;
  }

  return <div className="ai-source-cover-fallback" aria-hidden="true">
    <span className="ai-source-cover-fallback-brand"><Newspaper size={21}/>{publisher}</span>
    <strong>{title}</strong>
    <span className="ai-source-cover-fallback-foot">Original article <ArrowUpRight size={16}/></span>
  </div>;
}
