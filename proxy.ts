import {NextRequest,NextResponse} from 'next/server';
// Referral sources are external to TruTool. Strip this source from the visible destination URL on entry.
export function proxy(request:NextRequest){
 const url=request.nextUrl.clone();
 // Retired public profile, comparison, and guide URLs also resolve to clean category hubs.
 if(/chatgpt/i.test(url.pathname)){
  const hub=url.pathname.startsWith('/guides/')?'/guides':url.pathname.startsWith('/compare/')?'/compare':'/tools';
  url.pathname=hub;url.search='';url.hash='';
  return NextResponse.redirect(url,308);
 }
 const remove=[...url.searchParams.entries()].filter(([key,value])=>/chatgpt/i.test(key)||/chatgpt/i.test(value));
 if(!remove.length)return NextResponse.next();
 for(const [key] of remove)url.searchParams.delete(key);
 return NextResponse.redirect(url,307);
}
export const config={matcher:['/((?!api/|_next/|admin/|favicon.ico|robots.txt|sitemap.xml).*)']};
