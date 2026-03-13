export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#0f1117', color: '#e1e4e8' }}>
        <nav style={{ padding: '16px 24px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>DriftGuard</span>
          <span style={{ color: '#8b949e', fontSize: 14 }}>SaaS Config Monitor</span>
        </nav>
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
