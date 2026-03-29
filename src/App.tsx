import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  
  useEffect(() => {
    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // As requested, the system defaults to 6 outlets but is built cleanly to scale
  const outletCount = 6; 

  return (
    <>
      {!session ? (
        <Login />
      ) : (
        <Dashboard 
          outletCount={outletCount} 
          onLogout={async () => await supabase.auth.signOut()} 
        />
      )}
    </>
  )
}

export default App
