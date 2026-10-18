import ExamCorrections from './ExamCorrections'
import BulkDocuments from './BulkDocuments'
import { useState } from 'react'
import AttendanceCorrections from './AttendanceCorrections'
import MyPayslips from './MyPayslips'
import MessagingCenter from './MessagingCenter'

export default function NotificationRecord({row, user}) {
  const [open,setOpen]=useState(false)
  const target=row.destination || {}, type=target.type || row.notification_type
  if(!['attendance_correction','salary_query','payslip','message','document_batch','exam_correction'].includes(type) || !target.record_id) return null
  const account=user || JSON.parse(sessionStorage.getItem('school_session') || '{}').user
  return <><button onClick={()=>setOpen(true)}>Open record</button>{open&&<dialog open style={{position:'fixed',inset:'5vh 3vw',margin:0,width:'94vw',maxHeight:'90vh',overflow:'auto',zIndex:1500}} aria-label="Notification record"><button onClick={()=>setOpen(false)}>Close record</button>
    {type==='exam_correction'?<ExamCorrections user={account} correctionId={target.record_id}/>:type==='document_batch'?<BulkDocuments batchId={target.record_id}/>:type==='attendance_correction'?<AttendanceCorrections user={account} correctionId={target.record_id}/>:type==='message'?<MessagingCenter user={account} initialThreadId={target.thread_id}/>:<MyPayslips admin={account?.role==='School Admin'} queryId={type==='salary_query'?target.record_id:null} payslipId={type==='payslip'?target.record_id:null}/>}
  </dialog>}</>
}
