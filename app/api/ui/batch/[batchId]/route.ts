import { NextResponse } from 'next/server';
import { requireUiToken } from '@/lib/auth.js';
import { getBatch, listSessionsByBatch } from '@/lib/localStore.js';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { batchId: string } }) {
  const authErr = requireUiToken(request as any);
  if (authErr) return authErr;

  const batch = await getBatch(params.batchId);
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const sessions = await listSessionsByBatch(params.batchId);
  const pruned = sessions.map(s => ({
    sessionId: s.sessionId,
    ...s,
    srcDescription: undefined,
    targetDescription: undefined,
    resolvedText: undefined
  }));

  const counts: Record<string, number> = { total: sessions.length };
  for (const s of sessions) {
    const st = (s.status || 'PENDING') as string;
    counts[st] = (counts[st] || 0) + 1;
  }

  return NextResponse.json({ batch, sessions: pruned, counts });
}
