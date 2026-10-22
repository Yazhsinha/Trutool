'use client';
import Image from 'next/image';
import {useState} from 'react';
import {brandAssets} from '@/lib/brand-assets';
// Where a profile is not yet in the directory, prefer a vendor-associated icon to an invented mark.
// Any failed image falls back to clear brand initials, never a generic competitor's logo.
const additional:Record<string,string>={
 arphie:'https://www.google.com/s2/favicons?domain=arphie.ai&sz=128',
 qvidian:'https://www.google.com/s2/favicons?domain=uplandsoftware.com&sz=128',
 tribble:'https://tribblepublic.blob.core.windows.net/images/tribble_logo.png',
 conveyor:'https://www.google.com/s2/favicons?domain=conveyor.com&sz=128',
};
export function RfpBrandLogo({slug,name}:{slug:string;name:string}){
 const [failed,setFailed]=useState(false);
 const src=brandAssets[slug]||additional[slug];
 return <span className="rfp-brand-icon">{src&&!failed?
  <Image src={src} width={52} height={52} unoptimized alt={name+' official brand icon'} loading="lazy" onError={()=>setFailed(true)}/>:
  <span className="rfp-brand-fallback" aria-label={name+' logo unavailable'}>{name.slice(0,1)}</span>}
 </span>;
}
