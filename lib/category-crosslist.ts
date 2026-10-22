// Secondary directory placements: one canonical product page, multiple genuinely relevant category lists.
export const secondaryCategories:Record<string,string[]>={
 'ai-translation':['deepl','phrase','lokalise','crowdin','weglot','transifex'],
 'marketing':['mailchimp','semrush','ahrefs','hootsuite','sprout-social','omnisend','mailerlite','constant-contact']
};
export const inCategory=(tool:{slug:string;category:string},category:string)=>
 tool.category===category||(secondaryCategories[category]||[]).includes(tool.slug);
