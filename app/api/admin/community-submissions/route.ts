import { authenticated, privateResponse } from '@/lib/admin-auth';
import { get, list } from '@/lib/private-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Submission = {
  id: string;
  kind: 'question' | 'perspective';
  name: string;
  email?: string;
  question?: string;
  answerSlug?: string;
  category: string;
  message: string;
  createdAt: string;
  status: 'pending';
};
function valid(value: unknown): value is Submission {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return typeof r.id === 'string' &&
    ['question', 'perspective'].includes(String(r.kind)) &&
    typeof r.name === 'string' && typeof r.category === 'string' &&
    typeof r.message === 'string' && typeof r.createdAt === 'string' &&
    (r.kind !== 'question' || typeof r.question === 'string');
}

export async function GET() {
  if (!await authenticated()) return privateResponse({ error: 'Please sign in.' }, 401);
  try {
    const submissions: Submission[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const batch = await list({ prefix: 'community-submissions/', limit: 100, cursor });
      for (let i = 0; i < batch.blobs.length; i += 10) {
        const records = await Promise.all(batch.blobs.slice(i, i + 10).map(async item => {
          const response = await get(item.pathname, { access: 'private', useCache: false });
          if (!response || response.statusCode !== 200) return null;
          const content: unknown = await new Response(response.stream).json();
          return valid(content) ? content : null;
        }));
        for (const result of records) if (result) submissions.push(result);
      }
      cursor = batch.hasMore ? batch.cursor : undefined;
      pages++;
    } while (cursor && pages < 20);
    submissions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return privateResponse({ submissions, truncated: Boolean(cursor) });
  } catch {
    console.error('Private community submissions inbox failed');
    return privateResponse({ error: 'Community submissions could not be loaded.' }, 503);
  }
}
