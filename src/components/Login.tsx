import React, { useState } from 'react';
import { Sprout, Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Create an account
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Success! Check your email for the confirmation link to activate your account.');
      } else {
        // Sign in normally
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '2.5rem 2rem',
        animation: 'float 6s ease-in-out infinite' 
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            marginBottom: '1rem'
          }}>
            <Sprout size={32} color="var(--brand-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {isSignUp ? 'Create Admin Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isSignUp 
              ? 'Register a secure account to access the dashboard' 
              : 'Enter your credentials to access the precision seed dashboard.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle color="var(--danger)" size={18} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="agri@example.com"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Sign Up' : 'Sign In')} 
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', border: 'none', 
              color: 'var(--brand-secondary)', 
              fontSize: '0.85rem', cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up First'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
