import { timingSafeEqual } from 'node:crypto';
import { privateResponse } from '@/lib/admin-auth';
import { list } from '@/lib/private-storage';
import { deliverPendingWelcome } from '@/lib/newsletter-delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization') || '';
  const expected = secret ? 'Bearer ' + secret : '';
  const suppliedBytes = Buffer.from(header);
  const expectedBytes = Buffer.from(expected);
  if (!expected || suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes))
    return privateResponse({ error: 'Unauthorized.' }, 401);

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    return privateResponse({ ready: false, reason: 'Resend credentials not configured.', processed: 0 });

  let processed = 0, sent = 0, pending = 0, scanned = 0;
  let cursor: string | undefined;
  try {
    do {
      const batch = await list({ prefix: 'newsletter/subscribers/', limit: 100, cursor });
      for (const row of batch.blobs) {
        const status = await deliverPendingWelcome(row.pathname);
        scanned++;
        if (status === 'skipped') continue;
        processed++;
        if (status === 'sent') sent++;
        else pending++;
        if (processed >= 20) break; // Protect the Hobby runtime and Resend limits.
      }
      cursor = batch.hasMore ? batch.cursor : undefined;
    } while (cursor && processed < 20 && scanned < 10000);
    return privateResponse({ ready: true, scanned, processed, sent, pending });
  } catch {
    console.error('Dispatch retry job failed');
    return privateResponse({ error: 'Welcome delivery retry failed.', scanned, processed, sent, pending }, 503);
  }
}
