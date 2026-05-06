<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const quickNote = ref('')
const activeFilter = ref('tous')
const sheetOpen = ref(false)
const sheetNote = ref<any>(null)

const CATS = [
  { key: 'tous',    label: 'Toutes' },
  { key: 'memo',    label: '📝 Mémo' },
  { key: 'terrain', label: '🚶 Terrain' },
  { key: 'client',  label: '👤 Client' },
  { key: 'marche',  label: '📊 Marché' },
]

const CAT_COLORS: Record<string, string> = {
  memo:    'b-blue',
  terrain: 'b-green',
  client:  'b-orange',
  marche:  'b-purple',
}

const filtered = computed(() => {
  if (activeFilter.value === 'tous') return store.notes
  return store.notes.filter(n => n.type === activeFilter.value)
})

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function submit() {
  if (!quickNote.value.trim()) return
  store.addNote(quickNote.value.trim())
  store.toast('Note enregistrée ✓')
  quickNote.value = ''
}

function deleteNote(id: string) {
  store.notes.splice(store.notes.findIndex(n => n.id === id), 1)
  store.saveAll()
  store.toast('Note supprimée')
  closeSheet()
}

function openSheet(n: any) { sheetNote.value = n; sheetOpen.value = true }
function closeSheet() { sheetOpen.value = false; sheetNote.value = null }
</script>

<template>
  <section class="panel on notes-view">

    <div class="sh">
      <div>
        <div class="stitle">📝 Notes</div>
        <div class="ssub">Mémos terrain, observations, idées</div>
      </div>
    </div>

    <!-- Quick add -->
    <div class="quick-add">
      <input v-model="quickNote" class="quick-input" placeholder="Ajouter une note rapide..." @keyup.enter="submit" />
      <button class="btn btn-gold" @click="submit">+</button>
    </div>

    <!-- Filtres -->
    <div class="chips-bar">
      <button v-for="c in CATS" :key="c.key" class="chip" :class="{ active: activeFilter === c.key }" @click="activeFilter = c.key">
        {{ c.label }}
        <span v-if="c.key !== 'tous'" class="chip-count">{{ store.notes.filter(n => n.type === c.key).length }}</span>
      </button>
    </div>

    <!-- Stats -->
    <div class="stats" style="margin-bottom:8px">
      <div class="sc"><div class="sv">{{ store.notes.length }}</div><div class="sl">Total</div></div>
      <div class="sc"><div class="sv" style="color:var(--blue)">{{ store.notes.filter(n=>n.type==='memo').length }}</div><div class="sl">Mémos</div></div>
      <div class="sc"><div class="sv" style="color:var(--green)">{{ store.notes.filter(n=>n.type==='terrain').length }}</div><div class="sl">Terrain</div></div>
      <div class="sc"><div class="sv" style="color:var(--orange)">{{ store.notes.filter(n=>n.type==='client').length }}</div><div class="sl">Clients</div></div>
    </div>

    <!-- Notes -->
    <div class="notes-list">
      <div v-if="!filtered.length" class="notes-empty">
        <div style="font-size:28px;margin-bottom:8px">📝</div>
        <div style="font-weight:600;margin-bottom:4px">Aucune note</div>
        <div style="font-size:12px;color:var(--text3)">Tapez ci-dessus pour en créer une</div>
      </div>

      <div v-for="n in filtered" :key="n.id" class="note-card" @click="openSheet(n)">
        <div class="note-top">
          <div class="note-titre">{{ n.titre }}</div>
          <span class="badge" :class="CAT_COLORS[n.type] || 'b-gray'" style="font-size:9px">{{ n.type }}</span>
        </div>
        <div v-if="n.contenu" class="note-body">{{ n.contenu.slice(0, 120) }}{{ n.contenu.length > 120 ? '…' : '' }}</div>
        <div class="note-date">{{ fmtDate(n.date) }}</div>
      </div>
    </div>

    <!-- Sheet détail note -->
    <div v-if="sheetOpen" class="sheet-overlay" @click="closeSheet"></div>
    <div class="status-sheet" :class="{ open: sheetOpen }">
      <div class="sheet-handle"></div>
      <div v-if="sheetNote" style="padding:0 4px">
        <div class="sheet-title-note">{{ sheetNote.titre }}</div>
        <div style="font-size:12px;color:var(--text3);text-align:center;margin-bottom:14px">{{ fmtDate(sheetNote.date) }}</div>
        <div v-if="sheetNote.contenu" style="font-size:13px;color:var(--text2);line-height:1.7;background:var(--surface2);border-radius:10px;padding:12px;margin-bottom:14px;white-space:pre-wrap">{{ sheetNote.contenu }}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="sheet-opt" style="color:var(--red)" @click="deleteNote(sheetNote.id)">🗑️ Supprimer cette note</button>
        </div>
      </div>
      <button class="sheet-cancel" @click="closeSheet">Fermer</button>
    </div>

  </section>
</template>

<style scoped>
.notes-view { padding-bottom: 90px; }
.quick-add { display: flex; gap: 8px; padding: 0 16px 12px; }
.quick-input { flex: 1; background: var(--surface); border: 0.5px solid var(--border); border-radius: 12px; padding: 10px 14px; color: var(--text); font-size: 13px; outline: none; }
.chips-bar { display: flex; gap: 7px; padding: 0 16px 12px; overflow-x: auto; scrollbar-width: none; }
.chips-bar::-webkit-scrollbar { display: none; }
.chip { background: var(--surface); border: 0.5px solid var(--border); border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
.chip.active { background: var(--gold-bg); color: var(--gold); border-color: rgba(255,214,10,0.3); }
.chip-count { background: var(--surface2); border-radius: 8px; padding: 1px 6px; font-size: 10px; color: var(--text3); }
.notes-list { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
.notes-empty { text-align: center; padding: 36px 16px; color: var(--text2); }
.note-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 12px; padding: 12px 14px; cursor: pointer; }
.note-card:active { background: var(--surface2); }
.note-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 5px; }
.note-titre { font-size: 13px; font-weight: 600; flex: 1; }
.note-body { font-size: 12px; color: var(--text2); line-height: 1.5; margin-bottom: 8px; }
.note-date { font-size: 10px; color: var(--text3); }
.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; }
.status-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-radius: 20px 20px 0 0; border-top: 0.5px solid var(--border2); padding: 12px 16px 34px; z-index: 201; transform: translateY(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); }
.status-sheet.open { transform: translateY(0); }
.sheet-handle { width: 36px; height: 4px; background: var(--surface3); border-radius: 2px; margin: 0 auto 14px; }
.sheet-title-note { font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 4px; }
.sheet-opt { display: flex; align-items: center; gap: 10px; padding: 13px; border-radius: 12px; background: var(--surface2); border: 0.5px solid var(--border); font-size: 14px; cursor: pointer; width: 100%; }
.sheet-cancel { width: 100%; margin-top: 8px; padding: 13px; border-radius: 12px; background: var(--surface2); border: none; font-size: 14px; font-weight: 500; color: var(--text2); cursor: pointer; }
</style>
