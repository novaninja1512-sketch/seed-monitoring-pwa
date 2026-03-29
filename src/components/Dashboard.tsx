import React from 'react';
import OutletWidget from './OutletWidget';
import { Activity, LogOut, Settings } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  outletCount?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, outletCount = 6 }) => {
  // Generate dummy data based on the dynamic outlet count
  const outlets = Array.from({ length: outletCount }).map((_, i) => ({
    id: i + 1,
    status: (i % 3 === 0) ? 'warning' : 'healthy', // Just for visual preview
    seedCount: Math.floor(Math.random() * 500) + 100,
    flowRate: Math.floor(Math.random() * 20) + 10,
  }));

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem' }}>
            <Activity color="var(--brand-primary)" size={32} />
            Seed Monitor Active
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time outlet precision tracking
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass-panel" style={{ padding: '0.75rem', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} title="Settings">
            <Settings size={20} />
          </button>
          <button onClick={onLogout} className="glass-panel" style={{ padding: '0.75rem', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main>
        <div className={`grid-cols-${outletCount > 6 ? 4 : 3}`}>
          {outlets.map((outlet) => (
            <OutletWidget key={outlet.id} data={outlet as any} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
