import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUiToken } from '@/lib/auth.js';
import { getSession, nowTs, updateSession } from '@/lib/localStore.js';

export const runtime = 'nodejs';

function sha256(text: string) {
  const digest = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const authErr = requireUiToken(request as any);
  if (authErr) return authErr;

  const body = await request.json().catch(() => ({}));
  const resolution = body.resolution;
  const resolvedText = body.resolvedText;
  if (!resolution || typeof resolvedText !== 'string') {
    return NextResponse.json({ error: 'Missing resolution/resolvedText' }, { status: 400 });
  }

  const s = await getSession(params.sessionId);
  if (!s) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resolvedHash = sha256(resolvedText);
  const updated = await updateSession(params.sessionId, {
    status: 'RESOLVED',
    resolution,
    resolvedText,
    resolvedHash,
    resolvedAt: nowTs()
  });

  return NextResponse.json({ ok: true, resolved_hash: resolvedHash, session: updated });
}
