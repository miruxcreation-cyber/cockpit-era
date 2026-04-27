import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Acquereur, Copro, Mandat, Note, Proprietaire, Rdv, Secteur } from '../types/domain'

const KEYMAP = {
  mandats: 'mandats',
  acquereurs: 'acq',
  rdv: 'rdv_clients',
  notes: 'notes',
  secteurs: 't_secteurs',
  copros: 't_copros',
  proprietaires: 't_proprietaires',
} as const

async function fetchSeed<T>(name: string): Promise<T[]> {
  const res = await fetch(`/data/${name}.json`)
  if (!res.ok) return []
  return (await res.json()) as T[]
}

function loadLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export const useEraStore = defineStore('era', () => {
  const mandats = ref<Mandat[]>([])
  const acquereurs = ref<Acquereur[]>([])
  const rdv = ref<Rdv[]>([])
  const notes = ref<Note[]>([])
  const secteurs = ref<Secteur[]>([])
  const copros = ref<Copro[]>([])
  const proprietaires = ref<Proprietaire[]>([])
  const toasts = ref<Array<{ id: string; text: string }>>([])
  const pinUnlocked = ref(false)

  const todayTasks = computed(() => {
    const openRdv = rdv.value.filter((r) => !r.done).length
    const estimations = mandats.value.filter((m) => m.statut === 'estimation').length
    const prospects = acquereurs.value.filter((a) => a.statut === 'prospect').length
    return [
      `${openRdv} RDV a traiter`,
      `${estimations} estimations a convertir`,
      `${prospects} prospects a qualifier`,
    ]
  })

  function saveAll() {
    localStorage.setItem(KEYMAP.mandats, JSON.stringify(mandats.value))
    localStorage.setItem(KEYMAP.acquereurs, JSON.stringify(acquereurs.value))
    localStorage.setItem(KEYMAP.rdv, JSON.stringify(rdv.value))
    localStorage.setItem(KEYMAP.notes, JSON.stringify(notes.value))
    localStorage.setItem(KEYMAP.secteurs, JSON.stringify(secteurs.value))
    localStorage.setItem(KEYMAP.copros, JSON.stringify(copros.value))
    localStorage.setItem(KEYMAP.proprietaires, JSON.stringify(proprietaires.value))
  }

  async function boot() {
    const [m, a, r, n, s, c, p] = await Promise.all([
      fetchSeed<Mandat>('mandats'),
      fetchSeed<Acquereur>('acquereurs'),
      fetchSeed<Rdv>('rdv'),
      fetchSeed<Note>('notes'),
      fetchSeed<Secteur>('secteurs'),
      fetchSeed<Copro>('copros'),
      fetchSeed<Proprietaire>('proprietaires'),
    ])
    mandats.value = loadLocal<Mandat>(KEYMAP.mandats).length ? loadLocal<Mandat>(KEYMAP.mandats) : m
    acquereurs.value = loadLocal<Acquereur>(KEYMAP.acquereurs).length ? loadLocal<Acquereur>(KEYMAP.acquereurs) : a
    rdv.value = loadLocal<Rdv>(KEYMAP.rdv).length ? loadLocal<Rdv>(KEYMAP.rdv) : r
    notes.value = loadLocal<Note>(KEYMAP.notes).length ? loadLocal<Note>(KEYMAP.notes) : n
    secteurs.value = loadLocal<Secteur>(KEYMAP.secteurs).length ? loadLocal<Secteur>(KEYMAP.secteurs) : s
    copros.value = loadLocal<Copro>(KEYMAP.copros).length ? loadLocal<Copro>(KEYMAP.copros) : c
    proprietaires.value = loadLocal<Proprietaire>(KEYMAP.proprietaires).length ? loadLocal<Proprietaire>(KEYMAP.proprietaires) : p
    saveAll()
  }

  function toast(text: string) {
    const id = uid()
    toasts.value.unshift({ id, text })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 2600)
  }

  function addNote(content: string, type = 'memo') {
    notes.value.unshift({
      id: uid(),
      titre: 'Note rapide',
      contenu: content,
      type,
      date: new Date().toISOString(),
    })
    saveAll()
  }

  function addSecteur(data: Omit<Secteur, 'id'>) {
    secteurs.value.unshift({ id: uid(), ...data })
    saveAll()
    toast('✅ Secteur ajouté')
  }

  function addCopro(data: Omit<Copro, 'id'>) {
    copros.value.unshift({ id: uid(), ...data })
    saveAll()
    toast('✅ Copropriété ajoutée')
  }

  function addProprietaire(data: Omit<Proprietaire, 'id'>) {
    proprietaires.value.unshift({ id: uid(), ...data })
    saveAll()
    toast('✅ Propriétaire ajouté')
  }

  function getProprietairesByCopro(coproId: string) {
    return proprietaires.value.filter((p) => p.coproId === coproId)
  }

  function unlockPin(pin: string) {
    const key = 'era_pin_code'
    const current = localStorage.getItem(key)
    if (!current) {
      localStorage.setItem(key, pin)
      pinUnlocked.value = true
      sessionStorage.setItem('era_pin_ok', '1')
      return true
    }
    pinUnlocked.value = current === pin
    if (pinUnlocked.value) sessionStorage.setItem('era_pin_ok', '1')
    return pinUnlocked.value
  }

  function hydratePinState() {
    pinUnlocked.value = sessionStorage.getItem('era_pin_ok') === '1' || !localStorage.getItem('era_pin_code')
  }

  function setMandatStatut(id: string, statut: string) {
    const target = mandats.value.find((m) => m.id === id)
    if (!target) return
    target.statut = statut
    if (statut === 'actif' && !target.dateSign) {
      target.dateSign = new Date().toISOString().slice(0, 10)
    }
    saveAll()
  }

function updateMandat(updatedMandat: Mandat) {
  const index = mandats.value.findIndex(m => m.id === updatedMandat.id)
  if (index === -1) return

  mandats.value[index] = {
    ...mandats.value[index],
    ...updatedMandat
  }

  saveAll()
}

return {
  mandats,
  acquereurs,
  rdv,
  notes,
  secteurs,
  copros,
  proprietaires,
  toasts,
  pinUnlocked,
  todayTasks,

  boot,
  saveAll,
  toast,

  addNote,
  addSecteur,
  addCopro,
  addProprietaire,
  getProprietairesByCopro,

  setMandatStatut,
  unlockPin,
  hydratePinState,

  updateMandat
}
