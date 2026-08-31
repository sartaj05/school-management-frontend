import { GraduationCap } from 'lucide-react'

export default function Logo({ light = false }) {
  return <div className={`logo ${light ? 'logo-light' : ''}`}><span><GraduationCap size={24} /></span><strong>EduFlow</strong></div>
}
