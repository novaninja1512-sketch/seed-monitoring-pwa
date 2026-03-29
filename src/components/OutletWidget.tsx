import React from 'react';
import { Target, AlertTriangle, Droplets } from 'lucide-react';

export interface OutletData {
  id: number;
  status: 'healthy' | 'warning' | 'error';
  seedCount: number;
  flowRate: number; // seeds per minute
}

interface WidgetProps {
  data: OutletData;
}

const OutletWidget: React.FC<WidgetProps> = ({ data }) => {
  const isWarning = data.status === 'warning' || data.status === 'error';
  const glowColor = isWarning ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  const statusColor = isWarning ? 'var(--danger)' : 'var(--brand-primary)';

  return (
    <div className="glass-panel" style={{ 
      padding: '1.5rem', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Top Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: isWarning 
          ? 'linear-gradient(90deg, var(--danger), var(--warning))' 
          : 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
        boxShadow: `0 0 10px ${glowColor}`
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={18} color={statusColor} />
          Outlet #{data.id}
        </h3>
        
        {isWarning && (
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <AlertTriangle size={14} /> Check Flow
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Seed Count</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            {data.seedCount}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>seeds</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Droplets size={16} color="var(--brand-secondary)" />
          <span>Flow Rate: <strong style={{ color: 'white' }}>{data.flowRate}</strong> SPM</span>
        </div>
      </div>
      
      {/* Subtle pulsing indicator for real-time status */}
      <div style={{
        position: 'absolute',
        right: '1.5rem',
        bottom: '1.5rem',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: statusColor,
        boxShadow: `0 0 0 0 ${glowColor}`,
        animation: 'pulseGlow 2s infinite'
      }} />
    </div>
  );
};

export default OutletWidget;
