/* eslint-disable @next/next/no-img-element -- Native responsive markup keeps CMS covers server-rendered. */
import type { ComponentProps } from 'react';

// These are public, same-origin media routes. External or private preview URLs
// retain their original source instead of being sent through the image optimizer.
const localCover = /^\/(?:media\/[a-f0-9-]{36}\.webp|covers\/[\w-]+\.(?:webp|png|jpe?g))$/i;
const widths = [256, 384, 640, 750, 828, 1080, 1200, 1920];

type CoverProps = Omit<ComponentProps<'img'>, 'srcSet' | 'src' | 'alt' | 'sizes'> & {
  src: string;
  alt: string;
  sizes: string;
};

export function ResponsiveCover({ src, alt, sizes, ...props }: CoverProps) {
  const srcSet = localCover.test(src)
    ? widths.map(width => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75 ${width}w`).join(', ')
    : undefined;
  return <img {...props} src={src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} decoding="async"/>;
}
