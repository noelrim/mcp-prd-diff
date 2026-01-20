import crypto from 'crypto';

export function newId(prefix='') {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}${id}` : id;
}

export function appBaseUrl(req) {
  const env = process.env.APP_BASE_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  return `${proto}://${host}`;
}
