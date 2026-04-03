import { useEffect, useState } from 'react';
import OutletWidget from './OutletWidget';
import type { OutletData } from './OutletWidget';
import { Activity, LogOut, Settings, Loader2, Database, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArchivesModal from './ArchivesModal';

interface DashboardProps {
  onLogout: () => void;
  outletCount?: number;
}

const Dashboard = ({ onLogout, outletCount = 6 }: DashboardProps) => {
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchives, setShowArchives] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  // Handle the offset mathematics and anomaly detection
  const outletsToDisplay: OutletData[] = dataRows.map(row => {
    const physicalCount = parseInt(row.current_count || '0');
    let offset = parseInt(row.offset_count || '0');
    
    // ANOMALY DETECTION: If physical count is lower than offset, the ESP32 restarted/lost power!
    if (physicalCount < offset) {
      // The ESP32's memory wiped and started at 0. Healing the database state:
      offset = 0;
      supabase.from('seed_counts').update({ offset_count: 0 }).eq('id', row.id);
    }

    return {
      id: row.outlet_id,
      status: row.status as any,
      seedCount: physicalCount - offset, // Display clean session math without desyncing hardware
      flowRate: row.flow_rate
    };
  });

  const handleResetSession = async () => {
    if (!window.confirm("Are you sure you want to Archive this session and start counting from zero? (Your hardware will not be interrupted)")) return;
    
    setResetting(true);
    
    const totalSeeds = outletsToDisplay.reduce((sum, out) => sum + out.seedCount, 0);
    const sessionLabel = `Session: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;

    // 1. Archive the visible data
    const { error: archiveError } = await supabase.from('archived_sessions').insert({
      session_label: sessionLabel,
      total_seeds: totalSeeds,
      outlet_data: outletsToDisplay
    });

    if (archiveError) {
      console.error("Archive Error:", archiveError);
      alert("Failed to archive session.");
      setResetting(false);
      return;
    }

    // 2. Set the offset_counts in the database exactly equal to what the physical machine currently says
    for (const row of dataRows) {
      await supabase
        .from('seed_counts')
        .update({ offset_count: parseInt(row.current_count || '0') })
        .eq('id', row.id);
    }

    setResetting(false);
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem' }}>
            <Activity color="var(--brand-primary)" size={32} />
            KriFarm Seed Monitor
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Developed by KriFarm Equipments Pvt. Ltd.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          <button 
            onClick={() => setShowArchives(true)}
            className="glass-panel btn" 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }} 
            title="View History">
            <Database size={18} /> <span style={{ fontWeight: 600 }}>Archives</span>
          </button>

          <button 
            onClick={handleResetSession}
            disabled={resetting || outletsToDisplay.length === 0}
            className="glass-panel btn" 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', opacity: resetting ? 0.7 : 1 }} 
            title="Archive & Reset Count">
            {resetting ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />} 
            <span style={{ fontWeight: 600 }}>Reset Session</span>
          </button>
          
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

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

      {showArchives && <ArchivesModal onClose={() => setShowArchives(false)} />}
    </div>
  );
};

export default Dashboard;
