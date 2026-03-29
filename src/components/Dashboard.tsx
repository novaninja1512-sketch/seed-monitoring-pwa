import React, { useEffect, useState } from 'react';
import OutletWidget from './OutletWidget';
import type { OutletData } from './OutletWidget';
import { Activity, LogOut, Settings, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onLogout: () => void;
  outletCount?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, outletCount = 6 }) => {
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial rows from database
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('seed_counts')
        .select('*')
        .order('outlet_id', { ascending: true })
        .limit(outletCount);
      
      if (!error && data) {
        setDataRows(data);
      }
      setLoading(false);
    };

    fetchData();

    // 2. Subscribe to realtime updates for absolute live visualization
    const subscription = supabase
      .channel('realtime_seeds')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seed_counts' }, (payload) => {
        setDataRows((currentRows) => 
          currentRows.map((row) => 
            row.id === payload.new.id ? payload.new : row
          )
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seed_counts' }, (payload) => {
        setDataRows((current) => [...current, payload.new].sort((a,b) => a.outlet_id - b.outlet_id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [outletCount]);

  // If we don't have enough rows yet, we can pad them to ensure the UI looks good
  // but ideally the database gets initialized with the right amount
  const outletsToDisplay: OutletData[] = dataRows.map(row => ({
    id: row.outlet_id,
    status: row.status as any,
    seedCount: row.current_count,
    flowRate: row.flow_rate
  }));

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem' }}>
            <Activity color="var(--brand-primary)" size={32} />
            Seed Monitor Active
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Live PostgreSQL + ESP32 Precision Tracking
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass-panel btn" style={{ padding: '0.75rem', color: 'var(--text-primary)' }} title="Settings">
            <Settings size={20} />
          </button>
          <button onClick={onLogout} className="glass-panel btn" style={{ padding: '0.75rem', color: 'var(--danger)' }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <Loader2 className="animate-spin" size={48} color="var(--brand-primary)" />
          </div>
        ) : outletsToDisplay.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No Active Outlets Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Please run the initial database schema script to populate the dashboard.</p>
          </div>
        ) : (
          <div className={`grid-cols-${outletCount > 6 ? 4 : 3}`}>
            {outletsToDisplay.map((outlet) => (
              <OutletWidget key={outlet.id} data={outlet} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
