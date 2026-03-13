import ServiceCard from './components/ServiceCard';
import RecentChanges from './components/RecentChanges';

const SERVICES = [
  { id: 'stripe', name: 'Stripe', emoji: '💳', color: '#635bff' },
  { id: 'vercel', name: 'Vercel', emoji: '▲', color: '#000' },
  { id: 'sendgrid', name: 'SendGrid', emoji: '📧', color: '#1a82e2' },
];

export default function Dashboard() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: '#8b949e', margin: 0 }}>
          Monitor your SaaS configuration for unexpected changes
        </p>
      </div>

      {/* Service Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
        {SERVICES.map(s => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>

      {/* Recent Changes */}
      <RecentChanges />
    </div>
  );
}
