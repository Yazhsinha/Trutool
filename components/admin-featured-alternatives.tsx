'use client';
import {ArrowDown,ArrowUp,Check,LoaderCircle,Star} from 'lucide-react';
import {useCallback,useEffect,useState} from 'react';
type Candidate={slug:string;title:string;path:string;source:'editorial'|'cms'};
type Payload={available:Candidate[];featured:string[];error?:string};
export function AdminFeaturedAlternatives({revision}:{revision:number}){
 const [available,setAvailable]=useState<Candidate[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [saved,setSaved]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const reload=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const response=await fetch('/api/admin/featured-alternatives',{credentials:'same-origin',cache:'no-store'});
   const data:Payload=await response.json();
   if(!response.ok)throw new Error(data.error||'Unable to load featured alternatives.');
   setAvailable(data.available);setSelected(data.featured);setSaved(data.featured);
  }catch(e){setError((e as Error).message)}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void reload()},[reload,revision]);
 const changed=JSON.stringify(selected)!==JSON.stringify(saved);
 function toggle(slug:string){setNotice('');setSelected(current=>current.includes(slug)?current.filter(s=>s!==slug):current.length>=12?current:[...current,slug]);}
 function move(slug:string,delta:number){
  setSelected(current=>{const i=current.indexOf(slug),j=i+delta;if(i<0||j<0||j>=current.length)return current;const next=[...current];[next[i],next[j]]=[next[j],next[i]];return next;});
 }
 async function save(){
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/admin/featured-alternatives',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({slugs:selected})});
   const data:Payload=await response.json();
   if(!response.ok)throw new Error(data.error||'Unable to save featured alternatives.');
   setAvailable(data.available);setSelected(data.featured);setSaved(data.featured);
   setNotice('Saved. The public Featured Alternatives cards will refresh.');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const candidates=[...available].sort((a,b)=>{
  const ia=selected.indexOf(a.slug),ib=selected.indexOf(b.slug);
  if(ia>=0||ib>=0)return(ia<0?999:ia)-(ib<0?999:ib);
  return a.title.localeCompare(b.title);
 });
 return <section className="studio-panel studio-featured-alts" aria-labelledby="featured-alts-heading">
  <header className="studio-featured-heading">
   <div><span className="studio-kicker">ALTERNATIVES PROMOTION</span>
    <h2 id="featured-alts-heading"><Star size={21}/> Featured Alternatives</h2>
    <p>Choose which published alternatives appear at the top of the public Alternatives page. Tick a guide to feature it and use the arrows to control its position.</p>
   </div><a href="/alternatives" target="_blank" rel="noopener noreferrer">View featured section ↗</a>
  </header>
  {loading?<div className="studio-featured-status"><LoaderCircle size={18} className="studio-spin"/> Loading published alternatives…</div>:
   <>
    <div className="studio-featured-list">{candidates.map(item=>{
     const rank=selected.indexOf(item.slug),checked=rank>=0;
     return <div key={item.slug} className={'studio-featured-item'+(checked?' is-featured':'')}>
      <label><input type="checkbox" checked={checked} onChange={()=>toggle(item.slug)} disabled={busy}/>
       <span><strong>{item.title}</strong><small>{item.path}</small></span></label>
      <div className="studio-featured-actions">{checked&&<><span className="studio-featured-position">#{rank+1}</span>
       <button type="button" aria-label={'Move '+item.title+' up'} onClick={()=>move(item.slug,-1)} disabled={rank===0||busy}><ArrowUp size={16}/></button>
       <button type="button" aria-label={'Move '+item.title+' down'} onClick={()=>move(item.slug,1)} disabled={rank===selected.length-1||busy}><ArrowDown size={16}/></button></>}</div>
     </div>
    })}</div>
    {!candidates.length&&<p className="studio-featured-status">Publish an Alternatives article to feature it here.</p>}
    <footer className="studio-featured-footer"><span>{selected.length} of 12 featured · Only published alternatives appear publicly</span>
     <button type="button" className="studio-btn studio-dark" disabled={!changed||busy} onClick={save}>{busy?<LoaderCircle size={17} className="studio-spin"/>:<Check size={17}/>} Save featured order</button></footer>
   </>
  }
  {error&&<p className="studio-error" role="alert">{error}</p>}
  {notice&&<p className="studio-featured-notice" role="status">{notice}</p>}
 </section>;
}
