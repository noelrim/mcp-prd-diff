export default function Home() {
  return (
    <main style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: '#ffffffcc', border: '1px solid #eee', borderRadius: 20, padding: 24 }}>
          <h1 style={{ margin: 0 }}>Diff MCP App</h1>
          <p style={{ marginTop: 10, color: '#4b5563' }}>
            This app stores diff sessions locally and exposes an MCP endpoint for Codex to create, list, and
            resolve changes.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ padding: 16, border: '1px solid #e6e1d8', borderRadius: 16, background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>1) Create a batch</div>
            <div className="mono">POST /api/mcp → diff.create_sessions</div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e6e1d8', borderRadius: 16, background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>2) Open the batch URL</div>
            <div className="mono">/batch/&lt;batch_id&gt;</div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e6e1d8', borderRadius: 16, background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>3) Resolve sessions</div>
            <div className="mono">Select a session in the left pane and finalize.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
