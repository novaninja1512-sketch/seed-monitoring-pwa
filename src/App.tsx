import React, { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // As requested, the system defaults to 6 outlets but is built cleanly to scale
  // just by changing this single prop
  const outletCount = 6; 

  return (
    <>
      {isAuthenticated ? (
        <Dashboard 
          outletCount={outletCount} 
          onLogout={() => setIsAuthenticated(false)} 
        />
      ) : (
        <Login onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  )
}

export default App
