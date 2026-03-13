'use client';

import { useState, useEffect } from 'react';

export default function RecentChanges() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changes?limit=20')
      .then(r => r.json())
      .then(data => {
        setChanges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: '#8b949e' }}>Loading changes...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Changes</h2>
      {changes.length === 0 ? (
        <div style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          color: '#8b949e',
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
          <p>No configuration changes detected yet.</p>
          <p style={{ fontSize: 13 }}>Poll your services to start monitoring.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {changes.map(change => (
            <div key={change.id} style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontWeight: 600, marginRight: 8 }}>{change.service_name || change.service}</span>
                <span style={{ color: '#8b949e', fontSize: 13 }}>
                  {new Date(change.created_at).toLocaleString()}
                </span>
                <pre style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: '#c9d1d9',
                  background: '#0d1117',
                  padding: 8,
                  borderRadius: 4,
                  overflow: 'auto',
                }}>
                  {JSON.stringify(change.diff, null, 2)}
                </pre>
              </div>
              {!change.acknowledged && (
                <button style={{
                  background: 'transparent',
                  border: '1px solid #30363d',
                  color: '#8b949e',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}>
                  Ack
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
