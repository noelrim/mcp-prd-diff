import { NextResponse } from 'next/server';
import { requireUiToken } from '@/lib/auth.js';
import { listBatches, listSessionsByBatch } from '@/lib/localStore.js';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authErr = requireUiToken(request as any);
  if (authErr) return authErr;

  const batches = await listBatches();
  const output = [] as any[];
  for (const batch of batches) {
    const sessions = await listSessionsByBatch(batch.batchId);
    const counts: Record<string, number> = { total: sessions.length };
    for (const s of sessions) {
      const st = (s.status || 'PENDING') as string;
      counts[st] = (counts[st] || 0) + 1;
    }
    output.push({ ...batch, counts });
  }

  return NextResponse.json({ batches: output });
}
