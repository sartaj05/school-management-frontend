export const subscriptionStatuses = ['active', 'trialing', 'past_due', 'expired', 'suspended', 'cancelled']

export function subscriptionForm(subscription) {
  const rawPlan = String(subscription.plan || '').trim().toLowerCase()
  const plan = ['standard', 'trial', 'premium', 'enterprise'].includes(rawPlan) ? rawPlan : 'standard'
  return {
    plan: plan || 'standard', status: subscription.status || 'active',
    trial_ends_at: (subscription.trial_ends_at || '').slice(0, 16),
    plan_ends_at: (subscription.plan_ends_at || '').slice(0, 16), reason: '',
  }
}

export function subscriptionPayload(form) {
  const reason = form.reason.trim()
  if (!reason) throw new Error('Enter a reason for this subscription change.')
  const date = value => {
    if (!value) return null
    const parsed = new Date(`${value}Z`)
    if (!Number.isFinite(parsed.getTime())) throw new Error('Enter valid subscription expiry dates.')
    return parsed.toISOString()
  }
  return { plan: form.plan, status: form.status, trial_ends_at: date(form.trial_ends_at),
    plan_ends_at: date(form.plan_ends_at), reason }
}
