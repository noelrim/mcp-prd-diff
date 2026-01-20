'use client';

import { useEffect, useMemo, useState } from 'react';
import SessionResolver from '@/components/SessionResolver';
import BatchSelector from '@/components/BatchSelector';

const DEFAULT_BASE_URL = 'http://localhost:3000';

type SessionSummary = {
  sessionId: string;
  targetId: string;
  mode: 'create' | 'update';
  jiraKey?: string;
  status: 'PENDING' | 'RESOLVED' | 'APPLIED' | 'CANCELLED';
  targetSummary?: string;
  jiraSummary?: string;
};

type BatchResponse = {
  batch: { batchId: string; source?: any };
  sessions: SessionSummary[];
  counts: Record<string, number>;
};

type SessionDetail = {
  sessionId: string;
  batchId: string;
  targetId: string;
  targetSummary?: string;
  targetDescription: string;
  targetAnchor?: string;
  mode: 'create' | 'update';
  jiraKey?: string;
  jiraSummary?: string;
  status: 'PENDING' | 'RESOLVED' | 'APPLIED' | 'CANCELLED';
  srcDescription: string;
  resolution?: 'accept_target' | 'accept_src' | 'manual_edit';
  resolvedText?: string;
};

export default function BatchWorkspace({ batchId }: { batchId: string }) {
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<BatchResponse['batch'] | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [activeBatchId, setActiveBatchId] = useState(batchId);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch(`/api/ui/batch/${activeBatchId}`);
      const data: BatchResponse = await res.json();
      if (!mounted) return;
      setBatch(data.batch);
      setSessions(data.sessions);
      setCounts(data.counts || {});
      setSelectedId(data.sessions[0]?.sessionId || null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeBatchId]);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    async function loadSession() {
      const res = await fetch(`/api/ui/session/${selectedId}`);
      const data = await res.json();
      if (!mounted) return;
      setDetail(data.session);
    }
    loadSession();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const header = useMemo(() => {
    if (!batch) return null;
    const pending = counts.PENDING || 0;
    return (
      <div className="panel panel-header">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Batch {batch.batchId}</h2>
            <div className="mono" style={{ opacity: 0.7 }}>Sessions: {counts.total || 0}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge pending">Pending {counts.PENDING || 0}</span>
            <span className="badge resolved">Resolved {counts.RESOLVED || 0}</span>
            <span className="badge applied">Applied {counts.APPLIED || 0}</span>
            {pending === 0 && (
              <button className="btn primary" style={{ marginLeft: 8 }}>Pull resolved changes</button>
            )}
          </div>
        </div>
      </div>
    );
  }, [batch, counts]);

  return (
    <div className="app-shell">
      <section className="panel">
        <div className="panel-header">
          <div className="toolbar">
            <div>
              <h3 style={{ margin: 0 }}>Sessions</h3>
              <div className="mono" style={{ opacity: 0.7 }}>Review queue</div>
            </div>
          </div>
        </div>
        <div className="panel-body" style={{ paddingBottom: 0 }}>
          <BatchSelector
            currentBatchId={activeBatchId}
            onSelect={(id) => {
              setActiveBatchId(id);
              setSelectedId(null);
            }}
          />
        </div>
        <div className="session-list">
          {loading && <div className="mono">Loading…</div>}
          {!loading && sessions.map(s => (
            <button
              key={s.sessionId}
              className={`session-item ${s.status.toLowerCase()} ${selectedId === s.sessionId ? 'active' : ''}`}
              onClick={() => setSelectedId(s.sessionId)}
            >
              <div style={{ fontWeight: 700 }}>{s.targetId}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#374151' }}>
                {s.targetSummary || 'No target summary'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span>
                <span className="mono" style={{ color: '#6b7280' }}>Jira: {s.jiraKey || '—'}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel" style={{ display: 'grid', gridTemplateRows: 'auto 1fr' }}>
        {header}
        <div className="panel-body">
          {detail ? (
            <SessionResolver session={detail} />
          ) : (
            <div className="mono">Select a session to load the diff.</div>
          )}
        </div>
      </section>
    </div>
  );
}
