'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const DiffEditor = dynamic(() => import('@monaco-editor/react').then(m => m.DiffEditor), { ssr: false });
const Editor = dynamic(() => import('@monaco-editor/react').then(m => m.Editor), { ssr: false });

const TRACE_RE = /--- PRD TRACE ---[\s\S]*?--- \/PRD TRACE ---/;

function splitTrace(text: string) {
  const match = text.match(TRACE_RE);
  if (!match) return { body: text, trace: '' };
  return {
    body: text.replace(TRACE_RE, '').trim(),
    trace: match[0].trim()
  };
}

type Session = {
  sessionId: string;
  batchId: string;
  targetId: string;
  mode: 'create' | 'update';
  jiraKey?: string;
  targetSummary?: string;
  jiraSummary?: string;
  targetAnchor?: string;
  status: 'PENDING' | 'RESOLVED' | 'APPLIED' | 'CANCELLED';
  srcDescription: string;
  targetDescription: string;
  resolution?: 'accept_target' | 'accept_src' | 'manual_edit';
  resolvedText?: string;
};

export default function SessionResolver({ session }: { session: Session }) {
  const [choice, setChoice] = useState<'accept_target' | 'accept_src' | 'manual_edit'>(
    session.resolution || 'accept_target'
  );
  const [manual, setManual] = useState<string>(session.resolvedText || session.targetDescription || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string>('');

  useEffect(() => {
    if (choice === 'accept_target') setManual(session.targetDescription || '');
    if (choice === 'accept_src') setManual(session.srcDescription || '');
  }, [choice, session.srcDescription, session.targetDescription]);

  const resolvedText = useMemo(() => {
    if (choice === 'accept_target') return session.targetDescription || '';
    if (choice === 'accept_src') return session.srcDescription || '';
    return manual;
  }, [choice, manual, session.srcDescription, session.targetDescription]);

  const { body: srcBody, trace: srcTrace } = useMemo(() => splitTrace(session.srcDescription || ''), [session.srcDescription]);
  const { body: tgtBody, trace: tgtTrace } = useMemo(() => splitTrace(session.targetDescription || ''), [session.targetDescription]);

  async function finalize() {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await fetch(`/api/ui/session/${session.sessionId}/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resolution: choice, resolvedText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      setSavedMsg('Saved (RESOLVED).');
    } catch (e: any) {
      setSavedMsg(`Error: ${e.message || String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {session.targetId} · {session.targetSummary || ''}
        </div>
        <div style={{ color: '#6b7280', marginTop: 4 }}>
          Jira {session.jiraKey || '—'} · {session.mode} · {session.status}
        </div>
      </div>

      <div>
        <div className="section-title">How should this change be applied?</div>
        <div className="choice-grid">
          <button
            className={`choice-card ${choice === 'accept_target' ? 'active' : ''}`}
            onClick={() => setChoice('accept_target')}
          >
            ✓ Accept PRD changes
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Replace Jira with PRD</span>
          </button>
          <button
            className={`choice-card ${choice === 'accept_src' ? 'active' : ''}`}
            onClick={() => setChoice('accept_src')}
          >
            ↩ Keep Jira version
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Preserve current Jira</span>
          </button>
          <button
            className={`choice-card ${choice === 'manual_edit' ? 'active' : ''}`}
            onClick={() => setChoice('manual_edit')}
          >
            ✎ Manual edit
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Edit final text</span>
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 10, borderBottom: '1px solid #eee', background: '#fafafa', fontSize: 12 }}>
          Description
        </div>
        <div style={{ height: 520 }}>
          <DiffEditor
            language="markdown"
            original={srcBody}
            modified={tgtBody}
            options={{ readOnly: true, renderSideBySide: true, automaticLayout: true }}
          />
        </div>
      </div>

      {(srcTrace || tgtTrace) && (
        <details className="trace-toggle" open={false}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Trace metadata (collapsed)</summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
            <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>{srcTrace || '—'}</pre>
            <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>{tgtTrace || '—'}</pre>
          </div>
        </details>
      )}

      {choice === 'manual_edit' && (
        <div style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: 10, borderBottom: '1px solid #eee', background: '#fafafa', fontSize: 12 }}>
            Manual resolution
          </div>
          <div style={{ height: 420 }}>
            <Editor
              language="markdown"
              value={manual}
              onChange={(v) => setManual(v || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true }}
            />
          </div>
        </div>
      )}

      <div className="finalize">
        <div style={{ fontWeight: 700 }}>Ready to apply this decision</div>
        <button onClick={finalize} disabled={saving}>
          {saving ? 'Saving…' : 'Finalize and mark RESOLVED'}
        </button>
        {savedMsg && <div style={{ fontSize: 13 }}>{savedMsg}</div>}
      </div>
    </div>
  );
}
