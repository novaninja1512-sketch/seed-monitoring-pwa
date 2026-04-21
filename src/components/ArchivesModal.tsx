import { useEffect, useState } from 'react';
import { X, Calendar, Database, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OutletData } from './OutletWidget';

interface ArchivedSession {
  id: string;
  created_at: string;
  session_label: string;
  total_seeds: number;
  total_distance_m: number;
  outlet_data: OutletData[];
}

interface ArchivesModalProps {
  onClose: () => void;
}

export default function ArchivesModal({ onClose }: ArchivesModalProps) {
  const [archives, setArchives] = useState<ArchivedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArchives() {
      const { data } = await supabase
        .from('machine_archives')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setArchives(data);
      setLoading(false);
    }
    fetchArchives();
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.25rem' }}>
            <Database color="var(--brand-primary)" /> Historical Archives
          </h2>
          <button onClick={onClose} className="btn glass-panel" style={{ padding: '0.5rem', color: 'white' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading archives...</p>
          ) : archives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No archived sessions found. Go reset some counts to create an archive!</p>
            </div>
          ) : (
            archives.map(archive => (
              <div key={archive.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      <Calendar size={18} /> {archive.session_label}
                    </h3>
                    <p style={{ margin: 0, marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(archive.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--brand-secondary)', color: 'var(--brand-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Navigation size={14}/> {archive.total_distance_m} m
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Total: {archive.total_seeds} seeds
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                   {archive.outlet_data.map(outlet => (
                     <div key={outlet.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Outlet #{outlet.id}</div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{outlet.seedCount}</div>
                     </div>
                   ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
