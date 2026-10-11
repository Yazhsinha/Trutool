'use client';
import { MotionSymbol } from './motion-symbol';
import { useEffect, useRef, useState } from 'react';

type TocItem = { id: string; label: string };

export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    // Continue tracking the current section even while the user is between headings.
    const update = () => {
      frame = 0;
      const cutoff = Math.min(window.innerHeight * .35, 180);
      let current = items[0]?.id;
      for (const item of items) {
        const target = document.getElementById(item.id);
        if (target && target.getBoundingClientRect().top <= cutoff) current = item.id;
      }
      if (current) setActive(previous => previous === current ? previous : current);
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    queue();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !active) return;
    const link = [...nav.querySelectorAll<HTMLAnchorElement>('a[data-section-id]')]
      .find(anchor => anchor.dataset.sectionId === active);
    if (!link) return;

    // Scroll only the TOC panel. Do not move the reader's article viewport.
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const edge = 38;
    if (linkRect.top < navRect.top + edge || linkRect.bottom > navRect.bottom - edge) {
      const next = nav.scrollTop + (linkRect.top - navRect.top)
        - (nav.clientHeight - linkRect.height) / 2;
      nav.scrollTo({
        top: Math.max(0, next),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }, [active]);

  return <nav ref={navRef} className="article-toc" aria-label="On this page">
    <span className="eyebrow">ON THIS PAGE</span>
    {items.map(item => <a
      key={item.id}
      data-section-id={item.id}
      href={'#' + item.id}
      aria-current={active === item.id ? 'location' : undefined}
      className={active === item.id ? 'active' : ''}
      onClick={() => setActive(item.id)}
    >{item.label}</a>)}
    <a className="toc-action" href="/diagnostic"><MotionSymbol kind="scan" size={16}/>Build your decision plan</a>
    <a className="toc-action toc-newsletter" href="/newsletter"><MotionSymbol kind="mail" size={16}/>Get the next good find</a>
  </nav>;
}
