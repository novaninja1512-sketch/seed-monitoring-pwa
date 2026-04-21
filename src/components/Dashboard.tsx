import { useEffect, useState } from 'react';
import OutletWidget from './OutletWidget';
import type { OutletData } from './OutletWidget';
import { Activity, LogOut, Settings, Loader2, Database, RefreshCcw, Navigation, Gauge } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArchivesModal from './ArchivesModal';

interface DashboardProps {
  onLogout: () => void;
  outletCount?: number;
}

const Dashboard = ({ onLogout, outletCount = 6 }: DashboardProps) => {
  const [machineData, setMachineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showArchives, setShowArchives] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // 1. Fetch initial row from unified database
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('machine_state')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (!error && data) {
        setMachineData(data);
      }
      setLoading(false);
    };

    fetchData();

    // 2. Subscribe to realtime updates for absolute live visualization
    const subscription = supabase
      .channel('realtime_machine')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'machine_state' }, (payload) => {
        setMachineData(payload.new);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'machine_state' }, (payload) => {
        setMachineData(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Process the 6 Outlets
  const outletsToDisplay: OutletData[] = [];
  if (machineData) {
    for (let i = 1; i <= outletCount; i++) {
        const physicalCount = parseInt(machineData[`c${i}`] || '0');
        let offset = parseInt(machineData[`offset_c${i}`] || '0');

        // Anomaly tracking identical to before!
        if (physicalCount < offset) {
            offset = 0;
            supabase.from('machine_state').update({ [`offset_c${i}`]: 0 }).eq('id', 1);
        }

        outletsToDisplay.push({
            id: i,
            status: 'healthy',
            seedCount: physicalCount - offset,
            flowRate: 0 
        });
    }
  }

  // Process Machine Scope variables
  const physicalDistance = parseFloat(machineData?.distance_m || '0');
  let offsetDistance = parseFloat(machineData?.offset_distance_m || '0');
  if (physicalDistance < offsetDistance) {
      offsetDistance = 0;
      supabase.from('machine_state').update({ offset_distance_m: 0 }).eq('id', 1);
  }
  
  const displayDistance = (physicalDistance - offsetDistance).toFixed(2);
  const displayLevel = parseInt(machineData?.level_percent || '0');

  const handleResetSession = async () => {
    if (!window.confirm("Archive this session and start counting distance/seeds from zero?")) return;
    
    setResetting(true);
    
    const totalSeeds = outletsToDisplay.reduce((sum, out) => sum + out.seedCount, 0);
    const sessionLabel = `Session: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;

    // 1. Archive the visible data
    const { error: archiveError } = await supabase.from('machine_archives').insert({
      session_label: sessionLabel,
      total_seeds: totalSeeds,
      total_distance_m: parseFloat(displayDistance),
      outlet_data: outletsToDisplay
    });

    if (archiveError) {
      console.error("Archive Error:", archiveError);
      alert("Failed to archive session.");
      setResetting(false);
      return;
    }

    // 2. Set ALL offsets to current physical thresholds
    const updatePayload: any = { offset_distance_m: physicalDistance };
    for (let i = 1; i <= outletCount; i++) {
        updatePayload[`offset_c${i}`] = parseInt(machineData[`c${i}`] || '0');
    }

    await supabase.from('machine_state').update(updatePayload).eq('id', 1);
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
            disabled={resetting || !machineData}
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
        ) : !machineData ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No Machine State Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Please run the initial database schema script to populate the dashboard.</p>
          </div>
        ) : (
          <>
            {/* NEW: Global Machine Stats Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '50%' }}>
                  <Navigation color="var(--brand-secondary)" size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600 }}>Tractor Distance</p>
                  <h3 style={{ fontSize: '2rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    {displayDistance} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>meters</span>
                  </h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Gauge color="var(--brand-primary)" size={24} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Seed Chamber Level</span>
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: displayLevel < 20 ? 'var(--danger)' : 'white' }}>
                    {displayLevel}%
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                        height: '100%', 
                        width: `${displayLevel}%`, 
                        background: displayLevel < 20 ? 'var(--danger)' : 'var(--brand-primary)',
                        transition: 'width 0.5s ease-out, background 0.5s ease-out'
                    }}></div>
                </div>
              </div>
            </div>

            {/* Existing 6 Outlet Display */}
            <div className={`grid-cols-${outletCount > 6 ? 4 : 3}`}>
              {outletsToDisplay.map((outlet) => (
                <OutletWidget key={outlet.id} data={outlet} />
              ))}
            </div>
          </>
        )}
      </main>

      {showArchives && <ArchivesModal onClose={() => setShowArchives(false)} />}
    </div>
  );
};

export default Dashboard;
