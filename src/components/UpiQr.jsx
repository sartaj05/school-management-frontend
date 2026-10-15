import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function UpiQr({ invoice, amount }) {
  const [value, setValue] = useState(null), [error, setError] = useState('')
  useEffect(() => { let active = true; api(`/fees/invoices/${invoice}/upi-qr?amount=${encodeURIComponent(amount)}`).then(r => { if (active) setValue(r) }).catch(e => { if (active) setError(e.message) }); return () => { active = false } }, [invoice, amount])
  if (error) return <p role="alert">{error}</p>
  if (!value) return <p role="status">Preparing UPI QR…</p>
  return <figure style={{margin:'16px 0',textAlign:'center'}}><img src={value.qr_image} alt={`UPI payment QR for ${value.payee_name}, INR ${value.amount}`} width="240" height="240" style={{maxWidth:'100%',height:'auto',background:'white'}}/><figcaption>Scan to pay ₹{value.amount} to {value.payee_name}. Verify the payee in your UPI app.</figcaption><a href={value.qr_image} download={`school-payment-${invoice}.png`}>Download QR</a></figure>
}
