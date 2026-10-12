import { categories, categoryOf, getTool } from './catalog';
import { communityQuestionCards } from './community-answers';
import type { CmsContent } from './cms-types';

// Build the Community grid from both the curated baseline and published CMS Q&As.
// Only published, non-hidden CMS records may be supplied by getPublished().
export function communityCardsWithPublished(items: CmsContent[]) {
  const published = items
    .filter(content => content.kind === 'answer' && Boolean(content.publishedAt))
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .map(content => ({
      slug: content.slug,
      category: content.category,
      label: categories.some(c => c.slug === content.category) ? categoryOf(content.category).short : 'General',
      question: content.title,
      answer: content.description,
      helpful: 0,
      tools: content.toolSlugs
        .slice(0, 2)
        .map(slug => getTool(slug))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
        .map(tool => ({ slug: tool.slug, name: tool.name, initial: tool.initial })),
    }));
  const seen = new Set(published.map(question => question.slug));
  return [...published, ...communityQuestionCards.filter(question => !seen.has(question.slug))];
}
