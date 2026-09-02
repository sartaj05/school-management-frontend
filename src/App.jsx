import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { schoolApi } from './lib/api'

function readSession() { try { return JSON.parse(localStorage.getItem('school_session')) } catch { return null } }
export default function App() {
  const [session,setSession]=useState(readSession)
  const login=data=>{ localStorage.setItem('school_access_token',data.token); if(data.refresh_token)localStorage.setItem('school_refresh_token',data.refresh_token); localStorage.setItem('school_session',JSON.stringify(data)); setSession(data) }
  const logout=async()=>{ const refreshToken=localStorage.getItem('school_refresh_token'); try{if(refreshToken)await schoolApi.logout(refreshToken)}catch{/* Local logout must still complete when the API is unavailable. */}finally{localStorage.removeItem('school_access_token');localStorage.removeItem('school_refresh_token');localStorage.removeItem('school_session');setSession(null)} }
  useEffect(()=>{ const expired=()=>setSession(null); window.addEventListener('school-session-expired',expired); return()=>window.removeEventListener('school-session-expired',expired) },[])
  return <Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={session?<Navigate to="/dashboard" replace/>:<LoginPage onLogin={login}/>}/><Route path="/dashboard" element={session?<DashboardPage session={session} onLogout={logout}/>:<Navigate to="/login" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>
}
