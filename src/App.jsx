import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdmissionPage from './pages/AdmissionPage'
import ContactPage from './pages/ContactPage'
import { schoolApi } from './lib/api'
import { Contrast, Languages, Minus, Plus, RotateCcw } from 'lucide-react'
import { accessibilityTranslations, getLanguage, languageOptions } from './lib/i18n'

function readSession() { try { return JSON.parse(localStorage.getItem('school_session')) } catch { return null } }
function readPreferences() { try { return JSON.parse(localStorage.getItem('school_accessibility_preferences')) || {} } catch { return {} } }
export default function App() {
  const [session,setSession]=useState(readSession)
  const [flash,setFlash]=useState('')
  const [preferences,setPreferences]=useState(() => ({ language: 'en', fontScale: 1, highContrast: false, reduceMotion: false, ...readPreferences() }))
  const login=data=>{ localStorage.setItem('school_access_token',data.token); if(data.refresh_token)localStorage.setItem('school_refresh_token',data.refresh_token); localStorage.setItem('school_session',JSON.stringify(data)); setSession(data); setFlash(data.message||'Login successful.') }
  const updateProfile=profile=>{const updated={...session,user:{...session.user,name:profile.name,mobile:profile.mobile}};localStorage.setItem('school_session',JSON.stringify(updated));setSession(updated)}
  const logout=async()=>{ const refreshToken=localStorage.getItem('school_refresh_token'); try{if(refreshToken)await schoolApi.logout(refreshToken)}catch{/* Local logout must still complete when the API is unavailable. */}finally{localStorage.removeItem('school_access_token');localStorage.removeItem('school_refresh_token');localStorage.removeItem('school_session');setSession(null);setFlash('Logout successful.')} }
  useEffect(()=>{ if(!flash) return undefined; const timer=setTimeout(()=>setFlash(''),3200); return()=>clearTimeout(timer) },[flash])
  useEffect(()=>{ const expired=()=>setSession(null); window.addEventListener('school-session-expired',expired); return()=>window.removeEventListener('school-session-expired',expired) },[])
  useEffect(()=>{ const language=getLanguage(preferences.language); const nextPreferences={...preferences,language}; localStorage.setItem('school_accessibility_preferences',JSON.stringify(nextPreferences)); document.documentElement.lang=language; document.documentElement.dataset.language=language; document.documentElement.dataset.highContrast=preferences.highContrast?'true':'false'; document.documentElement.dataset.reduceMotion=preferences.reduceMotion?'true':'false'; document.documentElement.style.setProperty('--a11y-scale',String(preferences.fontScale||1)) },[preferences])
  const updatePreferences=change=>setPreferences(current=>({...current,...change}))
  return <><AccessibilityTools preferences={preferences} update={updatePreferences}/>{flash&&<div className="app-toast success">{flash}</div>}<Routes><Route path="/" element={<LandingPage language={preferences.language}/>}/><Route path="/contact" element={<ContactPage language={preferences.language}/>}/><Route path="/admissions/apply" element={<AdmissionPage language={preferences.language}/>}/><Route path="/login" element={session?<Navigate to="/dashboard" replace/>:<LoginPage onLogin={login} language={preferences.language}/>}/><Route path="/dashboard" element={session?<DashboardPage session={session} onLogout={logout} onProfileUpdated={updateProfile} language={preferences.language}/>:<Navigate to="/login" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></>
}

function AccessibilityTools({ preferences, update }) {
  const language=getLanguage(preferences.language)
  const copy=accessibilityTranslations[language]
  const selected=languageOptions.find(option=>option.value===language) || languageOptions[0]
  return <div className="accessibility-tools"><button className="language-trigger" aria-label={`${copy.language}: ${selected.native}`} title={copy.panel} onClick={()=>document.querySelector('.accessibility-tools')?.classList.toggle('open')}><Languages size={17}/><span>{selected.short}</span></button><div className="accessibility-panel" role="region" aria-label={copy.panel}><div className="accessibility-heading"><b>{copy.panel}</b><button onClick={()=>document.querySelector('.accessibility-tools')?.classList.remove('open')} aria-label={copy.close} title={copy.close}><RotateCcw size={14}/></button></div><label>{copy.language}<select value={language} onChange={event=>update({language:event.target.value})} aria-label={copy.language}>{languageOptions.map(option=><option value={option.value} key={option.value}>{option.native} · {option.label}</option>)}</select></label><div className="accessibility-control"><span>{copy.textSize}</span><div><button onClick={()=>update({fontScale:Math.max(.9,Number((preferences.fontScale-.1).toFixed(1)))})} aria-label={copy.decrease} title={copy.decrease}><Minus size={14}/></button><b>{Math.round(preferences.fontScale*100)}%</b><button onClick={()=>update({fontScale:Math.min(1.3,Number((preferences.fontScale+.1).toFixed(1)))})} aria-label={copy.increase} title={copy.increase}><Plus size={14}/></button></div></div><label className="accessibility-check"><input type="checkbox" checked={preferences.highContrast} onChange={event=>update({highContrast:event.target.checked})}/><Contrast size={15}/>{copy.highContrast}</label><label className="accessibility-check"><input type="checkbox" checked={preferences.reduceMotion} onChange={event=>update({reduceMotion:event.target.checked})}/>{copy.reduceMotion}</label></div></div>
}
