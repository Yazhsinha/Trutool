import type { ContentPage } from './content-index';

export const SITE_INDEX_PAGE_SIZE = 90;

export const siteIndexSections = [
  { id: 'tools', label: 'Tool profiles', description: 'Browse software and platform profiles.' },
  { id: 'alternatives', label: 'Alternatives', description: 'Find other options in the same software category.' },
  { id: 'categories', label: 'Categories', description: 'Explore all topic and software categories.' },
  { id: 'compare', label: 'Comparisons', description: 'Read the permanent, editorially curated comparisons.' },
  { id: 'guides', label: 'Buying guides', description: 'Read practical guides and evaluation checklists.' },
  { id: 'community', label: 'Community answers', description: 'Explore questions and detailed editorial answers.' },
  { id: 'authors', label: 'Authors', description: 'Meet contributors and editors.' },
  { id: 'services', label: 'Business services', description: 'Explore business service categories.' },
  { id: 'news', label: 'AI news', description: 'Read published news and analysis.' },
  { id: 'pages', label: 'Other pages', description: 'Find site information and public landing pages.' },
] as const;

export type SiteIndexSection = (typeof siteIndexSections)[number]['id'];
const sections = new Set<string>(siteIndexSections.map(s => s.id));

export function sectionForPublicPath(path: string): SiteIndexSection {
  const segment = path.split('/')[1];
  return path.split('/').filter(Boolean).length > 1 && sections.has(segment) && segment !== 'pages'
    ? segment as SiteIndexSection
    : 'pages';
}

export function groupSiteIndex(pages: readonly ContentPage[]) {
  const groups = siteIndexSections.map(section => ({
    ...section,
    pages: [] as ContentPage[],
    count: 0,
    chunks: 0,
  }));
  const byId = new Map(groups.map(g => [g.id, g]));
  for (const page of pages) {
    const group = byId.get(sectionForPublicPath(page.path))!;
    group.pages.push(page);
  }
  for (const group of groups) {
    group.pages.sort((a, b) => a.title.localeCompare(b.title, 'en') || a.path.localeCompare(b.path));
    group.count = group.pages.length;
    group.chunks = Math.ceil(group.count / SITE_INDEX_PAGE_SIZE);
  }
  return groups;
}

export const siteIndexPagePath = (section: SiteIndexSection, page: number) =>
  '/site-index/' + section + '/' + page;

export function siteIndexPaths(pages: readonly ContentPage[]) {
  return ['/site-index', ...groupSiteIndex(pages).flatMap(group =>
    Array.from({ length: group.chunks }, (_, i) => siteIndexPagePath(group.id, i + 1)))];
}
