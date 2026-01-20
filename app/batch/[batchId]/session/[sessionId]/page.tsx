import Link from 'next/link';
import SessionResolver from '@/components/SessionResolver';

const DEFAULT_BASE_URL = 'http://localhost:3000';

async function getSession(sessionId: string) {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL || DEFAULT_BASE_URL;
  const res = await fetch(`${base}/api/ui/session/${sessionId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load session ${sessionId}`);
  return res.json();
}

export default async function SessionPage({ params }: { params: { batchId: string; sessionId: string } }) {
  const data = await getSession(params.sessionId);
  const s = data.session;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>Session {params.sessionId}</h1>
        <Link href={`/batch/${params.batchId}`}>Back to batch</Link>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
        <div><b>Req:</b> {s.targetId}</div>
        <div><b>Target summary:</b> {s.targetSummary || ''}</div>
        <div><b>Jira summary:</b> {s.jiraSummary || ''}</div>
        <div><b>Mode:</b> {s.mode}</div>
        <div><b>Jira:</b> {s.jiraKey || ''}</div>
        {s.targetAnchor ? (
          <div>
            <b>PRD:</b> <a href={s.targetAnchor} target="_blank" rel="noreferrer">{s.targetAnchor}</a>
          </div>
        ) : null}
        <div><b>Status:</b> {s.status}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <SessionResolver session={s} />
      </div>
    </main>
  );
}
