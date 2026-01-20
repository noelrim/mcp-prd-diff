import { NextResponse } from 'next/server';
import { requireUiToken } from '@/lib/auth.js';
import { getSession } from '@/lib/localStore.js';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const authErr = requireUiToken(request as any);
  if (authErr) return authErr;

  const s = await getSession(params.sessionId);
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ session: { sessionId: s.sessionId, ...s } });
}
