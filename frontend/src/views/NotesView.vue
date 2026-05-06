<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const showModal = ref(false)
const form = reactive({ titre: '', contenu: '', type: 'memo' })

function submitNote() {
  if (!form.titre || !form.contenu) return
  store.addNote(form.titre, form.contenu, form.type)
  showModal.value = false
  Object.assign(form, { titre: '', contenu: '', type: 'memo' })
}

function truncate(s: string, len: number) {
  if (s.length <= len) return s
  return s.slice(0, len) + '...'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const types: Record<string, string> = {
  memo: '📝 Memo',
  terrain: '🗺️ Terrain',
  recherche: '👥 Acquéreur',
  important: '🔥 Important'
}
</script>

<template>
  <section class="panel on notes-view">
    <div class="sh">
      <div>
        <div class="stitle">📝 Notes</div>
        <div class="ssub">Vos mémos et rapports de pige</div>
      </div>
      <button class="btn btn-gold" @click="showModal = true">+ Nouvelle</button>
    </div>

    <div class="notes-grid">
      <div v-for="n in store.notes" :key="n.id" class="note-card">
        <div class="note-top">
          <span class="note-type">{{ types[n.type] || '📝 Note' }}</span>
          <span class="note-date">{{ fmtDate(n.date) }}</span>
        </div>
        <div class="note-title">{{ n.titre || 'Sans titre' }}</div>
        <div class="note-body">{{ truncate(n.contenu, 140) }}</div>
      </div>
      
      <div v-if="!store.notes.length" class="empty-state">
        <div class="empty-ico">📝</div>
        <div class="empty-txt">Aucune note pour le moment.</div>
      </div>
    </div>

    <!-- Modal Nouvelle Note -->
    <Teleport to="body">
      <div v-if="showModal" class="sheet-overlay" @click.self="showModal = false">
        <div class="status-sheet open" style="max-height: 80vh">
          <div class="sheet-handle"></div>
          <div class="sheet-title">📝 Nouvelle Note</div>
          
          <div class="form-grid">
            <input v-model="form.titre" class="field-input" placeholder="Titre de la note" style="font-weight: 700" />
            
            <select v-model="form.type" class="field-input">
              <option value="memo">📝 Memo personnel</option>
              <option value="terrain">🗺️ Rapport terrain</option>
              <option value="recherche">👥 Recherche acquéreur</option>
              <option value="important">🔥 Important / Urgent</option>
            </select>
            
            <textarea v-model="form.contenu" class="field-input field-textarea" placeholder="Contenu de la note..." rows="6"></textarea>
          </div>
          
          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="sheet-cancel" style="margin-top:0;flex:1" @click="showModal = false">Annuler</button>
            <button class="sheet-cancel" style="margin-top:0;flex:2;background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold)" @click="submitNote">Sauvegarder</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.notes-view { padding-bottom: 120px; }
.notes-grid { padding: 4px 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.note-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.note-card:active { transform: scale(0.97); background: var(--surface2); }

.note-top { display: flex; justify-content: space-between; align-items: center; }
.note-type { font-size: 9px; font-weight: 800; color: var(--gold); background: var(--gold-bg); padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
.note-date { font-size: 10px; color: var(--text3); font-weight: 700; font-family: var(--f-mono); }
.note-title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
.note-body { font-size: 13px; color: var(--text2); line-height: 1.5; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

.empty-state { grid-column: span 2; }
</style>
