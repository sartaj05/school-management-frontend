export const RELEASE_BUDGETS = Object.freeze({
  initialJavaScriptKb: 900,
  apiP95Ms: 800,
  accessibilityViolations: 0,
})

export function isWithinJavaScriptBudget(bytes, budgetKb = RELEASE_BUDGETS.initialJavaScriptKb) {
  return Number.isFinite(bytes) && bytes >= 0 && bytes <= budgetKb * 1024
}
