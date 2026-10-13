# TruTool

Independent software and learning directory built with Next.js.

## Development

Run `pnpm install` and `pnpm dev`. Run `pnpm build` for a production build.

## Deployment

The main branch deploys through the linked Vercel project. Set `NEXT_PUBLIC_SITE_URL` to the production origin. Contact submissions are saved as private JSON documents in the dedicated TruTool Vercel Blob store. `BLOB_READ_WRITE_TOKEN` stays server-only and must be configured for production and preview.

## Content

Profiles, guides, and comparison data are in `lib/catalog.ts`. Vendor logos and article covers are served locally from `public`. Brand provenance is recorded in `asset-sources/brand-logos.json`.

After changing catalog data or page copy, run `pnpm content:history` and commit
`lib/content-history.json` alongside the edit. Unchanged pages retain their dates.
For a historical correction, use `pnpm content:history --date <ISO timestamp>`
with the actual revision date. Builds only check this committed history and fail
if it is stale; they never stamp pages with the deployment time. Published CMS
records supply their saved publication/update dates to the relevant collections,
including the sitemap, Markdown, and server-rendered structured data.
