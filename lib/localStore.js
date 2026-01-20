import fs from 'fs/promises';
import path from 'path';

const DEFAULT_DIR = '.data';

function dataDir() {
  return process.env.DIFF_DATA_DIR || path.join(process.cwd(), DEFAULT_DIR);
}

async function ensureDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

async function readJson(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir(), fileName), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

async function writeJson(fileName, data) {
  await ensureDir();
  const filePath = path.join(dataDir(), fileName);
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2));
  await fs.rename(tmpPath, filePath);
}

export function nowTs() {
  return new Date().toISOString();
}

export async function createBatch(batch) {
  const batches = await readJson('batches.json', []);
  batches.push(batch);
  await writeJson('batches.json', batches);
  return batch;
}

export async function getBatch(batchId) {
  const batches = await readJson('batches.json', []);
  return batches.find(b => b.batchId === batchId) || null;
}


export async function listBatches() {
  const batches = await readJson('batches.json', []);
  batches.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return batches;
}

export async function createSession(session) {
  const sessions = await readJson('sessions.json', []);
  sessions.push(session);
  await writeJson('sessions.json', sessions);
  return session;
}

export async function getSession(sessionId) {
  const sessions = await readJson('sessions.json', []);
  return sessions.find(s => s.sessionId === sessionId) || null;
}

export async function updateSession(sessionId, patch) {
  const sessions = await readJson('sessions.json', []);
  const idx = sessions.findIndex(s => s.sessionId === sessionId);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...patch };
  await writeJson('sessions.json', sessions);
  return sessions[idx];
}

export async function listSessionsByBatch(batchId, status) {
  const sessions = await readJson('sessions.json', []);
  let out = sessions.filter(s => s.batchId === batchId);
  if (status) out = out.filter(s => s.status === status);
  out.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return out;
}

export async function getBatchCounts(batchId) {
  const sessions = await listSessionsByBatch(batchId);
  const counts = { total: sessions.length };
  for (const s of sessions) {
    const st = s.status || 'PENDING';
    counts[st] = (counts[st] || 0) + 1;
  }
  return counts;
}
