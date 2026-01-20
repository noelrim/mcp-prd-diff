'use client';

import { useEffect, useState } from 'react';

type BatchItem = {
  batchId: string;
  createdAt?: string;
  counts?: Record<string, number>;
};

type Props = {
  currentBatchId: string;
  onSelect: (batchId: string) => void;
};

export default function BatchSelector({ currentBatchId, onSelect }: Props) {
  const [batches, setBatches] = useState<BatchItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch('/api/ui/batches');
      const data = await res.json();
      if (!mounted) return;
      setBatches(data.batches || []);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Batch</label>
      <select
        value={currentBatchId}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: '#fff',
          fontSize: 13
        }}
      >
        {batches.map((b) => (
          <option key={b.batchId} value={b.batchId}>
            {b.batchId} ({b.counts?.total || 0})
          </option>
        ))}
      </select>
    </div>
  );
}
