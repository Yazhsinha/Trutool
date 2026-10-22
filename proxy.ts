import { NextRequest, NextResponse } from 'next/server';

// Clean ChatGPT referral labels from tracking parameters only.
// Never inspect page content or change legitimate guide/tool URLs.
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  let changed = false;

  for (const [key, value] of [...url.searchParams.entries()]) {
    const isTrackingParameter = /^(utm_[a-z0-9_-]+|ref|referrer|ref_src|source|via|from|origin|campaign|campaign_source)$/i.test(key)
      || /^chatgpt(?:[_-].*)?$/i.test(key);

    if (isTrackingParameter && (/chatgpt/i.test(key) || /chatgpt/i.test(value))) {
      url.searchParams.delete(key, value);
      changed = true;
    }
  }

  return changed ? NextResponse.redirect(url, 307) : NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/|admin/|favicon.ico|robots.txt|sitemap.xml).*)'],
};
