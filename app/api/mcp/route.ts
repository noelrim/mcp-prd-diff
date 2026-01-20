import { NextResponse } from 'next/server';
import { requireBearer } from '@/lib/auth.js';
import { newId, appBaseUrl } from '@/lib/ids.js';
import {
  createBatch,
  createSession,
  getBatchCounts,
  getSession,
  listSessionsByBatch,
  nowTs,
  updateSession
} from '@/lib/localStore.js';

export const runtime = 'nodejs';

type ManifestItem = {
  target_id: string;
  target_summary?: string;
  target_description?: string;
  target_anchor?: string;
  mode: 'create' | 'update';
  jira_key?: string;
  jira_summary?: string;
  src_description?: string;
  src_hash?: string;
  target_hash?: string;
  meta?: any;
};

export async function POST(request: Request) {
  const authErr = requireBearer(request as any, 'DIFF_MCP_TOKEN');
  if (authErr) return authErr;

  const body = await request.json();
  const isMcp = body && body.jsonrpc === '2.0' && typeof body.method === 'string';

  if (isMcp) {
    const id = body.id ?? null;
    const method = body.method;
    if (method === 'initialize') {
      const protocolVersion = body.params?.protocolVersion || '2024-11-05';
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: 'diff-mcp-app', version: '0.1.0' }
        }
      });
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'diff.create_sessions',
              description: 'Create a batch and sessions from a manifest.',
              inputSchema: {
                type: 'object',
                properties: {
                  source: { type: 'object' },
                  items: { type: 'array' }
                },
                required: ['items']
              }
            },
            {
              name: 'diff.get_batch_status',
              description: 'Get counts for a batch.',
              inputSchema: {
                type: 'object',
                properties: { batch_id: { type: 'string' } },
                required: ['batch_id']
              }
            },
            {
              name: 'diff.list_sessions',
              description: 'List sessions for a batch.',
              inputSchema: {
                type: 'object',
                properties: {
                  batch_id: { type: 'string' },
                  status: { type: 'string' },
                  include_texts: { type: 'boolean' }
                },
                required: ['batch_id']
              }
            },
            {
              name: 'diff.get_resolved',
              description: 'Get resolved content for a session.',
              inputSchema: {
                type: 'object',
                properties: { session_id: { type: 'string' } },
                required: ['session_id']
              }
            },
            {
              name: 'diff.mark_applied',
              description: 'Mark a session as applied.',
              inputSchema: {
                type: 'object',
                properties: {
                  session_id: { type: 'string' },
                  jira_key: { type: 'string' },
                  resolved_hash: { type: 'string' },
                  applied_hash: { type: 'string' }
                },
                required: ['session_id']
              }
            }
          ]
        }
      });
    }

    if (method === 'resources/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { resources: [] }
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }, { status: 404 });
  }

  const tool = body.tool;
  const args = body.args || {};

  const base = appBaseUrl(request as any);

  try {
    if (tool === 'diff.create_sessions') {
      const items: ManifestItem[] = args.items || [];
      const source = args.source || null;
      const batchId = newId('batch_');
      await createBatch({
        batchId,
        createdAt: nowTs(),
        source
      });

      const sessions: any[] = [];
      for (const it of items) {
        const sessionId = newId('sess_');
        await createSession({
          sessionId,
          batchId,
          targetId: it.target_id,
          targetSummary: it.target_summary || '',
          targetDescription: it.target_description || '',
          targetAnchor: it.target_anchor || '',
          mode: it.mode,
          jiraKey: it.jira_key || '',
          jiraSummary: it.jira_summary || '',
          srcDescription: it.src_description || '',
          srcHash: it.src_hash || '',
          targetHash: it.target_hash || '',
          meta: it.meta || {},
          status: 'PENDING',
          createdAt: nowTs()
        });

        sessions.push({
          session_id: sessionId,
          target_id: it.target_id,
          resolve_url: `${base}/batch/${batchId}/session/${sessionId}`
        });
      }

      return NextResponse.json({ batch_id: batchId, sessions });
    }

    if (tool === 'diff.get_batch_status') {
      const batchId = args.batch_id;
      if (!batchId) return NextResponse.json({ error: 'Missing batch_id' }, { status: 400 });
      const counts = await getBatchCounts(batchId);
      return NextResponse.json({ batch_id: batchId, ...counts });
    }

    if (tool === 'diff.list_sessions') {
      const batchId = args.batch_id;
      if (!batchId) return NextResponse.json({ error: 'Missing batch_id' }, { status: 400 });
      const includeTexts = !!args.include_texts;
      const sessions = await listSessionsByBatch(batchId, args.status);
      const out = sessions.map(s => {
        const baseObj: any = {
          session_id: s.sessionId,
          target_id: s.targetId,
          mode: s.mode,
          jira_key: s.jiraKey,
          status: s.status,
          target_summary: s.targetSummary,
          target_anchor: s.targetAnchor,
          jira_summary: s.jiraSummary,
          src_hash: s.srcHash,
          target_hash: s.targetHash,
          resolved_at: s.resolvedAt || null
        };
        if (includeTexts) {
          baseObj.src_description = s.srcDescription;
          baseObj.target_description = s.targetDescription;
          baseObj.resolved_text = s.resolvedText || '';
          baseObj.resolution = s.resolution || '';
        }
        return baseObj;
      });
      return NextResponse.json({ batch_id: batchId, sessions: out });
    }

    if (tool === 'diff.get_resolved') {
      const sessionId = args.session_id;
      if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
      const s = await getSession(sessionId);
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (s.status !== 'RESOLVED' && s.status !== 'APPLIED') {
        return NextResponse.json({ error: `Not resolved (status=${s.status})` }, { status: 409 });
      }
      return NextResponse.json({
        session_id: sessionId,
        target_id: s.targetId,
        mode: s.mode,
        jira_key: s.jiraKey,
        resolution: s.resolution || '',
        resolved_text: s.resolvedText || '',
        resolved_hash: s.resolvedHash || '',
        target_hash: s.targetHash || ''
      });
    }

    if (tool === 'diff.mark_applied') {
      const sessionId = args.session_id;
      const jiraKey = args.jira_key || '';
      const resolvedHash = args.resolved_hash || '';
      const appliedHash = args.applied_hash || resolvedHash || '';
      if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
      const s = await getSession(sessionId);
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (resolvedHash && s.resolvedHash && resolvedHash !== s.resolvedHash) {
        return NextResponse.json({ error: 'resolved_hash mismatch' }, { status: 409 });
      }
      await updateSession(sessionId, {
        status: 'APPLIED',
        jiraKey,
        appliedHash,
        appliedAt: nowTs()
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
