'use client';

import { useState, useEffect } from 'react';

export default function ServiceCard({ service }) {
  const [status, setStatus] = useState({ loading: true, lastPolled: null, changes: 0 });

  const pollNow = async () => {
    setStatus(s => ({ ...s, loading: true }));
    try {
      await fetch(`/api/services/${service.id}/poll`, { method: 'POST' });
      setStatus(s => ({ ...s, loading: false, lastPolled: new Date().toISOString() }));
    } catch {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 8,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{service.emoji}</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{service.name}</span>
        </div>
        <span style={{
          background: '#238636',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 12,
          fontSize: 12,
        }}>Connected</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8b949e', fontSize: 13 }}>
          {status.lastPolled ? `Last polled: ${new Date(status.lastPolled).toLocaleTimeString()}` : 'Not polled yet'}
        </span>
        <button
          onClick={pollNow}
          disabled={status.loading}
          style={{
            background: service.color,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            cursor: status.loading ? 'wait' : 'pointer',
            opacity: status.loading ? 0.6 : 1,
          }}
        >
          {status.loading ? 'Polling...' : 'Poll Now'}
        </button>
      </div>
    </div>
  );
}
