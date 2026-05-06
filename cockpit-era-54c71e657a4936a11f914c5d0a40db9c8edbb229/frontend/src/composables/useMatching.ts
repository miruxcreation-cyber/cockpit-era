import type { Acquereur, Mandat } from '../types/domain'

export function scoreMatch(acq: Acquereur, mandat: Mandat): number {
  let score = 0
  const budget = Number(acq.budget || 0)
  const price = Number(mandat.fai || mandat.prix || 0)
  const area = (acq.secteur || '').toLowerCase()
  const address = (mandat.adresse || '').toLowerCase()
  const typeA = (acq.type || '').toLowerCase()
  const typeM = (mandat.type || '').toLowerCase()
  const notes = (acq.notes || '').toLowerCase()

  if (budget && price) {
    if (price <= budget) score += 25
    else if (price <= budget * 1.12) score += 8
    else score -= 30
  }
  if (area && address.includes(area.split(',')[0].trim())) score += 20
  if (typeA && typeM && typeA.includes(typeM)) score += 20
  if (notes && address.split(' ').some((w) => w.length > 4 && notes.includes(w.toLowerCase()))) score += 35
  if (acq.profil === 'invest') score += 5
  return score
}
