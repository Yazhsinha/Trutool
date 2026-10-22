import type { Tool } from '@/lib/catalog';
export function SubmittedProfile({tool}:{tool:Tool}){
 const profile=tool.profile;
 if(!profile)return null;
 return <>
  <section id="applications">
   <h2>Where {tool.name} fits best</h2>
   <p>{profile.overview}</p>
   <h3>Practical use cases</h3>
   <ul>{profile.useCases.map(x=><li key={x}>{x}</li>)}</ul>
   <div className="article-callout"><strong>Where to look elsewhere</strong><p>{profile.notIdeal}</p></div>
  </section>
  <section id="workflow">
   <h2>How to use {tool.name}</h2>
   <ol>{profile.workflow.map(x=><li key={x}>{x}</li>)}</ol>
   <p className="editor-note">Workflow and product availability depend on the provider's current offering. These steps are evaluation guidance, not an independently verified tutorial.</p>
  </section>
  <section id="questions">
   <h2>What to check before choosing {tool.name}</h2>
   <ul>{profile.checks.map(x=><li key={x}>{x}</li>)}</ul>
   <h2>Frequently asked questions</h2>
   {profile.faqs.map(f=><div key={f.question} className="article-faq"><h3>{f.question}</h3><p>{f.answer}</p></div>)}
  </section>
 </>;
}
