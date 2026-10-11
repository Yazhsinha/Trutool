import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  get as blobGet,
  head as blobHead,
  list as blobList,
  put as blobPut,
} from '@vercel/blob';
import 'server-only';

export { BlobNotFoundError, BlobPreconditionFailedError };

// Select Supabase explicitly only after recovering the existing private Blob data.
// Until then, every existing deployment continues using the original Blob store.
export const usingSupabaseStorage = () => process.env.TRUTOOL_STORAGE_BACKEND === 'supabase';

type StoredRow = {
  path: string;
  payload: Record<string, unknown>;
  etag: string;
  created_at: string;
  updated_at: string;
};

function configuration() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !secret) {
    throw new Error('TruTool Supabase storage is not configured');
  }
  return { url, secret };
}

async function request(path: string, init: RequestInit = {}) {
  const { url, secret } = configuration();
  const response = await fetch(url + path, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: secret,
      Authorization: 'Bearer ' + secret,
      ...init.headers,
    },
  });
  return response;
}

async function findRow(path: string): Promise<StoredRow | null> {
  const query = new URLSearchParams({
    select: 'path,payload,etag,created_at,updated_at',
    path: 'eq.' + path,
    limit: '1',
  });
  const response = await request('/rest/v1/trutool_objects?' + query);
  if (!response.ok) throw new Error('TruTool private storage read failed: ' + response.status);
  const rows = await response.json() as StoredRow[];
  return rows[0] || null;
}

async function writeRow(path: string, payload: Record<string, unknown>, ifMatch?: string) {
  const response = await request('/rest/v1/rpc/trutool_write_object', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_path: path, p_payload: payload, p_if_match: ifMatch || null }),
  });
  if (!response.ok) throw new Error('TruTool private storage write failed: ' + response.status);
  const result = await response.json() as { ok: boolean; conflict?: boolean; etag?: string };
  if (!result.ok) throw new BlobPreconditionFailedError();
  return result.etag!;
}

export async function head(path: string) {
  if (!usingSupabaseStorage()) return blobHead(path);
  const row = await findRow(path);
  if (!row) throw new BlobNotFoundError();
  return { url: row.path, pathname: row.path, etag: row.etag, contentType: String(row.payload.contentType || 'application/json') };
}

export async function get(path: string, options: { access: 'private'; useCache?: boolean }) {
  if (!usingSupabaseStorage()) return blobGet(path, options);
  const row = await findRow(path);
  if (!row) return null;
  if (row.payload.media === true) {
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const response = await request('/storage/v1/object/authenticated/trutool-media/' + encoded);
    if (response.status === 404) return null;
    if (!response.ok || !response.body) throw new Error('TruTool media read failed: ' + response.status);
    return { statusCode: 200 as const, stream: response.body, blob: { etag: row.etag } };
  }
  const stream = new Response(JSON.stringify(row.payload.data)).body!;
  return { statusCode: 200 as const, stream, blob: { etag: row.etag } };
}

export async function put(
  path: string,
  body: string | Buffer,
  options: {
    access: 'private';
    contentType?: string;
    addRandomSuffix?: boolean;
    allowOverwrite?: boolean;
    ifMatch?: string;
  },
) {
  if (!usingSupabaseStorage()) return blobPut(path, body, options);
  if (!path.startsWith('cms/') && !path.startsWith('newsletter/') && !path.startsWith('enquiries/')) {
    throw new Error('Unsupported storage path');
  }
  if (path.startsWith('cms/media/')) {
    if (!Buffer.isBuffer(body)) throw new Error('Invalid media data');
    // Media IDs are UUIDs, unique and intentionally immutable.
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const response = await request('/storage/v1/object/trutool-media/' + encoded, {
      method: 'POST',
      headers: { 'Content-Type': options.contentType || 'image/webp', 'x-upsert': 'false' },
      body: new Uint8Array(body),
    });
    if (response.status === 409) throw new BlobPreconditionFailedError();
    if (!response.ok) throw new Error('TruTool media upload failed: ' + response.status);
    await writeRow(path, { media: true, size: body.length, contentType: options.contentType || 'image/webp' });
    return { url: '/media/' + path.split('/').at(-1), pathname: path };
  }
  if (typeof body !== 'string') throw new Error('Invalid JSON data');
  const parsed = JSON.parse(body) as Record<string, unknown>;
  await writeRow(path, { data: parsed, contentType: options.contentType || 'application/json' }, options.ifMatch);
  return { url: path, pathname: path };
}

export async function list(options: { prefix?: string; limit?: number; cursor?: string } = {}) {
  if (!usingSupabaseStorage()) return blobList(options);
  const limit = Math.max(1, Math.min(100, options.limit || 100));
  const offset = options.cursor && /^\d+$/.test(options.cursor) ? Number(options.cursor) : 0;
  const query = new URLSearchParams({
    select: 'path,payload,etag,created_at,updated_at',
    path: 'like.' + (options.prefix || '') + '*',
    order: 'path.asc',
    limit: String(limit + 1),
    offset: String(offset),
  });
  const response = await request('/rest/v1/trutool_objects?' + query);
  if (!response.ok) throw new Error('TruTool private storage list failed: ' + response.status);
  const rows = await response.json() as StoredRow[];
  const hasMore = rows.length > limit;
  return {
    blobs: rows.slice(0, limit).map(row => ({
      pathname: row.path,
      url: row.path,
      uploadedAt: new Date(row.created_at),
      size: Number(row.payload.size || JSON.stringify(row.payload.data || {}).length),
    })),
    hasMore,
    cursor: hasMore ? String(offset + limit) : undefined,
  };
}
