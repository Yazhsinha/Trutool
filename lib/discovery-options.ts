export const discoveryOptions=[
 {id:'all',label:'All tools',description:'Explore every relevant match.'},
 {id:'popular',label:'Popular picks',description:'Recognisable products with strong category relevance. Editorial selection, not a claim of measured traffic.'},
 {id:'useful',label:'Most useful',description:'Practical, well-documented tools for solving the task you searched for.'},
 {id:'niche',label:'Niche finds',description:'Focused products with specialist workflows. Your query and category stay applied.'},
] as const;
export type DiscoveryMode=typeof discoveryOptions[number]['id'];
export const normalizeDiscovery=(value:string):DiscoveryMode=>discoveryOptions.some(o=>o.id===value)?value as DiscoveryMode:'all';
export const normalizeSort=(value:string)=>['az','newest'].includes(value)?value:'relevance';
