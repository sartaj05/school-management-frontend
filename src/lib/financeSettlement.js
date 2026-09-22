export function calculateSettlement({ openingBalance = 0, income = 0, expenses = 0, refunds = 0, countedBalance = null }) {
  const expectedBalance = Number((Number(openingBalance) + Number(income) - Number(expenses) - Number(refunds)).toFixed(2))
  const variance = countedBalance === null || countedBalance === '' || countedBalance === undefined
    ? null
    : Number((Number(countedBalance) - expectedBalance).toFixed(2))
  return { expectedBalance, variance }
}
