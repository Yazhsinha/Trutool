'use client';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, LoaderCircle, MessageCircleQuestion, RefreshCw, Send } from 'lucide-react';

export type CommunitySubmission = {
  id: string;
  kind: 'question' | 'perspective';
  name: string;
  email?: string;
  category: string;
  question?: string;
  answerSlug?: string;
  message: string;
  createdAt: string;
  status: 'pending';
};

export function AdminCommunityQueue({ onCreateAnswer }: { onCreateAnswer: (submission: CommunitySubmission) => void }) {
  const [rows, setRows] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/community-submissions', { cache: 'no-store', credentials: 'same-origin', signal });
      const data = await res.json() as { submissions?: CommunitySubmission[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Unable to load community questions.');
      setRows(data.submissions || []);
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) setError(err instanceof Error ? err.message : 'Unable to load submissions.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void refresh(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refresh]);

  return <section className="studio-panel studio-community-queue">
    <div className="studio-panel-heading">
      <div><span className="studio-kicker">READER QUESTIONS · PRIVATE MODERATION</span>
        <h2>Incoming community questions <span className="studio-community-count">{rows.length}</span></h2>
        <p>Review reader submissions and turn a question into an editorial answer draft. Submissions are never published automatically.</p>
      </div>
      <div className="studio-community-actions">
        <button type="button" className="studio-btn studio-outline" disabled={loading} onClick={() => void refresh()}>
          {loading ? <LoaderCircle className="studio-spin" size={16}/> : <RefreshCw size={16}/>} Refresh
        </button>
        <button type="button" className="studio-btn studio-outline" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
          {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    </div>
    {expanded && <>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {loading && !rows.length && <p className="studio-community-note">Loading reader questions…</p>}
      {!loading && !rows.length && !error && <div className="studio-community-empty"><MessageCircleQuestion size={23}/><p>No community submissions yet. Published answers you create will appear in the public Q&A grid.</p></div>}
      {!!rows.length && <div className="studio-community-submissions">
        {rows.map(item => <article key={item.id} className="studio-community-submission">
          <div className="studio-community-submission-top">
            <span className="studio-kicker">{item.kind === 'question' ? 'QUESTION' : 'READER PERSPECTIVE'} · {item.category}</span>
            <small>{Number.isFinite(Date.parse(item.createdAt)) ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</small>
          </div>
          <h3>{item.kind === 'question' ? item.question : 'Perspective on ' + (item.answerSlug || 'community topic')}</h3>
          {item.message && <p className="studio-community-message">{item.message}</p>}
          <div className="studio-community-submission-bottom">
            <span>From {item.name}{item.email ? ' · ' + item.email : ''} · Private until reviewed</span>
            {item.kind === 'question' && item.question && <button type="button" className="studio-btn studio-dark" onClick={() => onCreateAnswer(item)}>
              <Send size={15}/> Draft an answer
            </button>}
          </div>
        </article>)}
      </div>}
    </>}
  </section>;
}
