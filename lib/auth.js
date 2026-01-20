import { NextResponse } from 'next/server';

export function requireBearer(request, envName) {
  const token = process.env[envName];
  if (!token) {
    return NextResponse.json({ error: `Server misconfigured: missing ${envName}` }, { status: 500 });
  }
  const auth = request.headers.get('authorization') || '';
  const expected = `Bearer ${token}`;
  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireUiToken(request) {
  const token = process.env.DIFF_UI_TOKEN;
  if (!token) {
    // If not set, UI endpoints are open (use Vercel protection)
    return null;
  }
  const header = request.headers.get('x-ui-token') || '';
  if (header !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
