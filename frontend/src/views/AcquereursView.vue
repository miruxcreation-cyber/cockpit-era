<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useEraStore } from '../stores/era'
// import { scoreMatch } from './composables/useMatching'

import { scoreMatch } from './composables/useMatching'

import type { Acquereur } from '../types/domain'

const store = useEraStore()

const query = ref('')
const activeFilter = ref('tous')
const showProspects = ref(false)
const sheetOpen = ref(false)
const sheetTarget = ref<Acquereur | null>(null)
const swipedId = ref<string | null>(null)
const showModalNewAcq = ref(false)
const matchSheetOpen = ref(false)
const matchTarget = ref<Acquereur | null>(null)

const formAcq = reactive({ nom: '', tel: '', email: '', budget: '', secteur: '', notes: '', source: 'terrain' })

function submitAcq() {
  if (!formAcq.nom) return
  store.addAcquereur({
    nom: formAcq.nom,
    tel: formAcq.tel,
    email: formAcq.email,
    budget: formAcq.budget || undefined,
    secteur: formAcq.secteur,
    notes: formAcq.notes,
    statut: 'qualifie',
    dateAjout: new Date().toISOString().slice(0, 10),
  })
  showModalNewAcq.value = false
  Object.assign(formAcq, { nom: '', tel: '', email: '', budget: '', secteur: '', notes: '', source: 'terrain' })
}

const STATUTS = [
  { key: 'prospect',  label: 'Prospect',            icon: '👋' },
  { key: 'actif',     label: 'Actif — en recherche', icon: '🔵' },
  { key: 'qualifie',  label: 'Qualifié — chaud',     icon: '🔥' },
  { key: 'offre',     label: 'Offre en cours',       icon: '💬' },
  { key: 'compromis', label: 'Compromis signé',      icon: '📝' },
  { key: 'inactif',   label: 'Inactif',              icon: '💤' },
]

const BADGE: Record<string, string> = {
  qualifie:  'b-red',
  offre:     'b-orange',
  actif:     'b-blue',
  compromis: 'b-green',
  prospect:  'b-gray',
  inactif:   'b-gray',
}

const FILTERS = [
  { key: 'tous',      label: 'Tous' },
  { key: 'chauds',    label: '🔥 Chauds' },
  { key: 'actifs',    label: '🟡 Actifs' },
  { key: 'prospects', label: '🔵 Prospects' },
  { key: 'relance',   label: '⏰ À relancer' },
]

function daysSinceContact(a: Acquereur): number {
  const lc = (a as any).lastContact
  if (!lc) return 999
  return Math.floor((Date.now() - new Date(lc).getTime()) / 86400000)
}

function callAcq(a: Acquereur) {
  const tel = (a as any).tel
  if (tel) { store.markLastContact('acquereur', a.id); window.location.href = `tel:${tel}` }
}

function waAcq(a: Acquereur) {
  const tel = (a as any).tel
  if (tel) { store.markLastContact('acquereur', a.id); window.open(`https://wa.me/${String(tel).replace(/\D/g, '')}`) }
}

function matchedMandatsCount(a: Acquereur): number {
  return store.mandats.filter(m => scoreMatch(a, m) > 35).length
}

function matchedMandatsList(a: Acquereur) {
  return store.mandats
    .filter(m => !['expire', 'retire', 'acte'].includes(m.statut))
    .map(m => ({ m, score: scoreMatch(a, m) }))
    .filter(x => x.score >= 35)
    .sort((a, b) => b.score - a.score)
}

function openMatchSheet(a: Acquereur) { matchTarget.value = a; matchSheetOpen.value = true; swipedId.value = null }
function closeMatchSheet() { matchSheetOpen.value = false; matchTarget.value = null }

function initials(nom: string): string {
  return nom.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

function avatarClass(a: Acquereur): string {
  if (['qualifie', 'offre'].includes(a.statut)) return 'av-red'
  if (a.statut === 'actif') return 'av-blue'
  return 'av-gray'
}

function statutLabel(key: string): string {
  return STATUTS.find(s => s.key === key)?.label || key
}

const toRelance = computed(() =>
  store.acquereurs.filter(a => ['qualifie', 'actif'].includes(a.statut) && daysSinceContact(a) >= 7)
)

const filtered = computed(() => {
  let list = store.acquereurs
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    list = list.filter(a => a.nom.toLowerCase().includes(q) || (a.secteur || '').toLowerCase().includes(q))
  }
  if (activeFilter.value === 'chauds')    return list.filter(a => ['qualifie', 'offre'].includes(a.statut))
  if (activeFilter.value === 'actifs')    return list.filter(a => a.statut === 'actif')
  if (activeFilter.value === 'prospects') return list.filter(a => ['prospect', 'inactif'].includes(a.statut))
  if (activeFilter.value === 'relance')   return list.filter(a => daysSinceContact(a) >= 7)
  return list
})

const chauds    = computed(() => filtered.value.filter(a => ['qualifie', 'offre'].includes(a.statut)))
const actifs    = computed(() => filtered.value.filter(a => a.statut === 'actif'))
const prospects = computed(() => filtered.value.filter(a => ['prospect', 'inactif', 'compromis'].includes(a.statut)))

function openSheet(a: Acquereur) {
  sheetTarget.value = a
  sheetOpen.value = true
  swipedId.value = null
}

function closeSheet() {
  sheetOpen.value = false
  sheetTarget.value = null
}

function applyStatut(key: string) {
  if (!sheetTarget.value) return
  const target = store.acquereurs.find(a => a.id === sheetTarget.value!.id)
  if (target) {
    target.statut = key
    store.saveAll()
    store.toast('Statut mis à jour')
  }
  closeSheet()
}

function toggleSwipe(id: string) {
  swipedId.value = swipedId.value === id ? null : id
}
</script>

<template>
  <section class="panel on acq-view">

    <div class="sh">
      <div>
        <div class="stitle">👥 Acquéreurs</div>
        <div class="ssub">Qualification et matching avec vos mandats</div>
      </div>
      <button class="btn btn-gold" @click="showModalNewAcq = true">+ Ajouter</button>
    </div>

    <div class="stats">
      <div class="sc"><div class="sv">{{ store.acquereurs.length }}</div><div class="sl">Total</div></div>
      <div class="sc"><div class="sv" style="color:var(--red)">{{ store.chaudAcq.length }}</div><div class="sl">Chauds</div></div>
      <div class="sc"><div class="sv" style="color:var(--orange)">{{ store.activeAcq.length }}</div><div class="sl">Actifs</div></div>
      <div class="sc"><div class="sv" style="color:var(--text3)">{{ store.acquereurs.filter(a => ['prospect','inactif'].includes(a.statut)).length }}</div><div class="sl">Prospects</div></div>
    </div>

    <div class="srch">
      <div class="srch-inner">
        <span class="srch-ico">🔍</span>
        <input v-model="query" placeholder="Rechercher un acquéreur..." />
      </div>
    </div>

    <div class="chips-bar">
      <button
        v-for="f in FILTERS" :key="f.key"
        class="chip"
        :class="{ active: activeFilter === f.key, 'chip-alert': f.key === 'relance' }"
        @click="activeFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <div v-if="toRelance.length" class="relance-banner">
      <div class="relance-title">À relancer aujourd'hui</div>
      <div v-for="a in toRelance.slice(0, 3)" :key="a.id" class="relance-row">
        <span class="relance-name">{{ a.nom }}</span>
        <span class="relance-days">+{{ daysSinceContact(a) }}j</span>
        <button class="relance-call" @click="callAcq(a)">📞 Rappeler</button>
      </div>
    </div>

    <!-- CHAUDS -->
    <template v-if="chauds.length">
      <div class="m-section-header">
        <div class="m-section-dot" style="background:var(--red);box-shadow: 0 0 8px var(--red);" />
        <span class="m-section-title">Chauds</span>
        <span class="count-badge" style="margin-left:8px">{{ chauds.length }}</span>
      </div>
      <div class="acq-list">
        <div v-for="a in chauds" :key="a.id" class="card-outer">
          <div class="swipe-actions">
            <button class="swa swa-call" @click="callAcq(a)">📞<span>Appel</span></button>
            <button class="swa swa-wa" @click="waAcq(a)">💬<span>WA</span></button>
            <button class="swa swa-status" @click="openSheet(a)">✏️<span>Statut</span></button>
          </div>
          <div class="card" :class="{ swiped: swipedId === a.id }" @click="toggleSwipe(a.id)">
            <div v-if="daysSinceContact(a) >= 7" class="alert-bar">Sans contact depuis {{ daysSinceContact(a) }}j</div>
            <div class="card-top">
              <div class="avatar" :class="avatarClass(a)">{{ initials(a.nom) }}</div>
              <div class="card-info">
                <div class="card-name">{{ a.nom }}</div>
                <div class="card-sub">{{ a.secteur || '—' }} · {{ a.profil || '—' }}</div>
              </div>
              <span class="badge" :class="BADGE[a.statut] || 'b-gray'" @click.stop="openSheet(a)">
                {{ statutLabel(a.statut) }}
              </span>
            </div>
            <div class="card-rows">
              <div class="card-row"><span class="card-lbl">Budget</span><span class="card-val" style="font-family:var(--f-mono)">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
              <div class="card-row"><span class="card-lbl">Recherche</span><span class="card-val">{{ a.type || '—' }}</span></div>
              <div class="card-row" style="cursor:pointer" @click.stop="openMatchSheet(a)">
                <span class="card-lbl">Matching</span>
                <span class="card-val match-val">
                  <span class="dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="i <= Math.min(matchedMandatsCount(a), 5) ? 'dot-on' : 'dot-off'"></span>
                  </span>
                  <span style="font-family:var(--f-mono)">{{ matchedMandatsCount(a) }}</span> mandat{{ matchedMandatsCount(a) > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="card-ft">
              <div class="acq-act-row" style="width:100%;justify-content:space-between">
                <button class="acq-ico ai-call" @click.stop="callAcq(a)">📞</button>
                <button class="acq-ico ai-wa" @click.stop="waAcq(a)">💬</button>
                <button class="acq-ico ai-match" @click.stop="openMatchSheet(a)">🎯</button>
                <button class="acq-ico ai-note" @click.stop>📝</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ACTIFS -->
    <template v-if="actifs.length">
      <div class="m-section-header" style="margin-top:24px">
        <div class="m-section-dot" style="background:var(--orange);box-shadow: 0 0 8px var(--orange);" />
        <span class="m-section-title">Actifs</span>
        <span class="count-badge" style="margin-left:8px">{{ actifs.length }}</span>
      </div>
      <div class="acq-list">
        <div v-for="a in actifs" :key="a.id" class="card-outer">
          <div class="swipe-actions">
            <button class="swa swa-call" @click="callAcq(a)">📞<span>Appel</span></button>
            <button class="swa swa-wa" @click="waAcq(a)">💬<span>WA</span></button>
            <button class="swa swa-status" @click="openSheet(a)">✏️<span>Statut</span></button>
          </div>
          <div class="card" :class="{ swiped: swipedId === a.id }" @click="toggleSwipe(a.id)">
            <div v-if="daysSinceContact(a) >= 7" class="alert-bar">Sans contact depuis {{ daysSinceContact(a) }}j</div>
            <div class="card-top">
              <div class="avatar av-blue">{{ initials(a.nom) }}</div>
              <div class="card-info">
                <div class="card-name">{{ a.nom }}</div>
                <div class="card-sub">{{ a.secteur || '—' }} · {{ a.profil || '—' }}</div>
              </div>
              <span class="badge b-blue" @click.stop="openSheet(a)">{{ statutLabel(a.statut) }}</span>
            </div>
            <div class="card-rows">
              <div class="card-row"><span class="card-lbl">Budget</span><span class="card-val" style="font-family:var(--f-mono)">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
              <div class="card-row"><span class="card-lbl">Recherche</span><span class="card-val">{{ a.type || '—' }}</span></div>
              <div class="card-row" style="cursor:pointer" @click.stop="openMatchSheet(a)">
                <span class="card-lbl">Matching</span>
                <span class="card-val match-val">
                  <span class="dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="i <= Math.min(matchedMandatsCount(a), 5) ? 'dot-on' : 'dot-off'"></span>
                  </span>
                  <span style="font-family:var(--f-mono)">{{ matchedMandatsCount(a) }}</span> mandat{{ matchedMandatsCount(a) > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="card-ft">
              <div class="acq-act-row" style="width:100%;justify-content:space-between">
                <button class="acq-ico ai-call" @click.stop="callAcq(a)">📞</button>
                <button class="acq-ico ai-wa" @click.stop="waAcq(a)">💬</button>
                <button class="acq-ico ai-match" @click.stop="openMatchSheet(a)">🎯</button>
                <button class="acq-ico ai-note" @click.stop>📝</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- PROSPECTS -->
    <template v-if="prospects.length">
      <div class="m-section-header" style="margin-top:24px;cursor:pointer" @click="showProspects = !showProspects">
        <div class="m-section-dot" style="background:var(--text3);box-shadow:none" />
        <span class="m-section-title">Prospects</span>
        <span class="count-badge" style="margin-left:8px">{{ prospects.length }}</span>
        <span class="ssub" style="margin-left:auto">{{ showProspects ? 'Réduire ↑' : 'Développer ↓' }}</span>
      </div>
      <template v-if="showProspects">
        <div class="acq-list">
          <div v-for="a in prospects" :key="a.id" class="card-outer">
            <div class="swipe-actions">
              <button class="swa swa-call" @click="callAcq(a)">📞<span>Appel</span></button>
              <button class="swa swa-wa" @click="waAcq(a)">💬<span>WA</span></button>
              <button class="swa swa-status" @click="openSheet(a)">✏️<span>Statut</span></button>
            </div>
            <div class="card" :class="{ swiped: swipedId === a.id }" @click="toggleSwipe(a.id)">
              <div class="card-top">
                <div class="avatar av-gray">{{ initials(a.nom) }}</div>
                <div class="card-info">
                  <div class="card-name">{{ a.nom }}</div>
                  <div class="card-sub">{{ a.secteur || '—' }} · {{ a.profil || '—' }}</div>
                </div>
                <span class="badge b-gray" @click.stop="openSheet(a)">{{ statutLabel(a.statut) }}</span>
              </div>
              <div class="card-rows">
                <div class="card-row"><span class="card-lbl">Budget</span><span class="card-val" style="font-family:var(--f-mono)">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
                <div class="card-row"><span class="card-lbl">Recherche</span><span class="card-val">{{ a.type || '—' }}</span></div>
              </div>
              <div class="card-ft">
                <div class="acq-act-row" style="width:100%;justify-content:space-between">
                  <button class="acq-ico ai-call" @click.stop="callAcq(a)">📞</button>
                  <button class="acq-ico ai-note" @click.stop>📝</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="prospects-toggle" @click="showProspects = true">
        Afficher les {{ prospects.length }} prospects ↓
      </div>
    </template>

    <!-- Sheet statut -->
    <div v-if="sheetOpen" class="sheet-overlay" @click="closeSheet"></div>
    <div class="status-sheet" :class="{ open: sheetOpen }">
      <div class="sheet-handle"></div>
      <div class="sheet-title">{{ sheetTarget?.nom }} — Changer le statut</div>
      <div class="sheet-options">
        <button
          v-for="s in STATUTS" :key="s.key"
          class="sheet-opt"
          :class="{ 'sheet-opt-active': sheetTarget?.statut === s.key }"
          @click="applyStatut(s.key)"
        >
          <span>{{ s.icon }}</span>
          <span>{{ s.label }}</span>
          <span v-if="sheetTarget?.statut === s.key" style="margin-left:auto;color:var(--gold)">✓</span>
        </button>
      </div>
      <button class="sheet-cancel" @click="closeSheet">Annuler</button>
    </div>

    <!-- Sheet matching pour Acquéreurs -->
    <div v-if="matchSheetOpen" class="sheet-overlay" @click="closeMatchSheet"></div>
    <div class="status-sheet" :class="{ open: matchSheetOpen }" style="max-height:70vh;overflow-y:auto">
      <div class="sheet-handle"></div>
      <div class="sheet-title">🏠 Mandats compatibles</div>
      <div v-if="matchTarget" style="padding:0 4px">
        <div v-if="!matchedMandatsList(matchTarget).length" style="text-align:center;padding:24px;color:var(--text3);font-size:13px">
          Aucun mandat en cours correspondant
        </div>
        <div v-for="entry in matchedMandatsList(matchTarget)" :key="entry.m.id" class="sheet-opt" style="margin-bottom:8px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">{{ entry.m.adresse.split(',')[0] }}</div>
            <div style="font-size:11px;color:var(--text3)">
               {{ entry.m.type || 'Bien' }} {{ entry.m.surface ? '· ' + entry.m.surface + 'm²' : '' }} · {{ entry.m.fai ? Number(entry.m.fai).toLocaleString('fr-FR') + ' €' : (entry.m.prix ? Number(entry.m.prix).toLocaleString('fr-FR') + ' € (net)' : '—') }}
            </div>
          </div>
          <span class="badge b-green">Score {{ entry.score }}</span>
        </div>
      </div>
      <button class="sheet-cancel" @click="closeMatchSheet">Fermer</button>
    </div>

    <!-- Modal Nouvel Acquéreur -->
    <Teleport to="body">
      <div v-if="showModalNewAcq" class="sheet-overlay" @click.self="showModalNewAcq = false" style="display:flex;align-items:flex-end;z-index:200;">
        <div class="status-sheet" :class="{ open: showModalNewAcq }" style="position:relative;max-height:85vh;overflow-y:auto;width:100%;">
          <div class="sheet-handle"></div>
          <div class="sheet-title">👥 Nouvel Acquéreur</div>

          <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:12px">
            <div>
              <label style="font-size:11px;color:var(--text2);margin-bottom:4px;display:block">Nom / Prénom *</label>
              <input v-model="formAcq.nom" style="width:100%;padding:10px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface2);color:var(--text)" placeholder="ex: Jean Dupont" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label style="font-size:11px;color:var(--text2);margin-bottom:4px;display:block">Téléphone</label>
                <input v-model="formAcq.tel" type="tel" style="width:100%;padding:10px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface2);color:var(--text)" placeholder="06 xx xx xx xx" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--text2);margin-bottom:4px;display:block">Budget max</label>
                <input v-model="formAcq.budget" type="number" style="width:100%;padding:10px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface2);color:var(--text)" placeholder="€" />
              </div>
            </div>

            <div>
              <label style="font-size:11px;color:var(--text2);margin-bottom:4px;display:block">Secteurs recherchés</label>
              <input v-model="formAcq.secteur" style="width:100%;padding:10px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface2);color:var(--text)" placeholder="ex: Centre-ville, T3 minimum..." />
            </div>

            <div>
              <label style="font-size:11px;color:var(--text2);margin-bottom:4px;display:block">Notes & Critères</label>
              <textarea v-model="formAcq.notes" rows="3" style="width:100%;padding:10px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface2);color:var(--text)" placeholder="Financement validé ? Critères stricts ?"></textarea>
            </div>
          </div>

          <div style="display:flex;gap:10px">
            <button class="sheet-cancel" style="margin-top:0;flex:1" @click="showModalNewAcq = false">Annuler</button>
            <button class="sheet-cancel" style="margin-top:0;flex:2;background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold)" @click="submitAcq">Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<style scoped>
.acq-view { padding-bottom: 120px; }

.acq-list { padding: 4px 4px 0; display: flex; flex-direction: column; gap: 4px; }

.m-section-header {
  padding: 16px 20px 8px;
  display: flex;
  align-items: center;
}

.m-section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
}

.m-section-title {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text2);
}

.relance-banner { 
  margin: 0 20px 20px; 
  background: var(--surface2); 
  border: 1px solid var(--border); 
  border-radius: 20px; 
  padding: 20px; 
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.relance-title { font-size: 10px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
.relance-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
.relance-row:last-child { border: none; }
.relance-name { font-size: 15px; font-weight: 800; flex: 1; letter-spacing: -0.01em; }
.relance-days { font-size: 11px; color: var(--red); font-weight: 800; margin-right: 12px; font-family: var(--f-mono); }
.relance-call { font-size: 10px; font-weight: 800; color: var(--blue); background: var(--blue-bg); border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; text-transform: uppercase; }

.count-badge { font-size: 11px; background: var(--surface2); color: var(--text3); border-radius: 10px; padding: 4px 10px; font-weight: 800; font-family: var(--f-mono); border: 1px solid var(--border); }

.alert-bar { 
  font-size: 9px; 
  font-weight: 900; 
  color: var(--red); 
  background: var(--red-bg); 
  border-radius: 8px; 
  padding: 6px 12px; 
  margin-bottom: 20px; 
  display: inline-flex; 
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  gap: 6px;
}
.alert-bar::before { content: "⚠️"; }

.avatar { 
  width: 44px; height: 44px; 
  border-radius: 14px; 
  display: flex; align-items: center; justify-content: center; 
  font-size: 13px; font-weight: 900; flex-shrink: 0; 
  border: 1px solid var(--border);
}
.av-red { background: var(--red-bg); color: var(--red); border-color: rgba(255,69,58,0.2); }
.av-blue { background: var(--blue-bg); color: var(--blue); border-color: rgba(10,132,255,0.2); }
.av-gray { background: var(--surface2); color: var(--text3); }

.card-info { flex: 1; margin-left: 16px; }
.card-name { font-size: 17px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.02em; }
.card-sub { font-size: 13px; color: var(--text3); font-weight: 500; }

.match-val { display: flex; align-items: center; gap: 10px; }
.dots { display: flex; gap: 4px; }
.dot { width: 4px; height: 4px; border-radius: 50%; }
.dot-on { background: var(--green); box-shadow: 0 0 5px var(--green); }
.dot-off { background: var(--surface3); }

.card-ft { 
  margin-top: 16px; 
  padding-top: 16px; 
  border-top: 1px solid var(--border); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.acq-act-row { display: flex; gap: 8px; align-items: center; }
.acq-ico { 
  width: 40px; height: 40px; border-radius: 12px; 
  background: var(--surface2); border: 1px solid var(--border); 
  display: flex; align-items: center; justify-content: center; 
  font-size: 15px; cursor: pointer; color: #fff;
  transition: all 0.2s;
}
.acq-ico:active { transform: scale(0.9); background: var(--surface3); }

.ai-call { color: var(--green); }
.ai-wa { color: #25d366; }
.ai-note { color: var(--text2); }
.ai-match { color: var(--blue); }

.badge {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.b-blue { background: var(--blue-bg); color: var(--blue); }
.b-orange { background: var(--orange-bg); color: var(--orange); }
.b-green { background: var(--green-bg); color: var(--green); }
.b-red { background: var(--red-bg); color: var(--red); }
.b-gray { background: var(--surface2); color: var(--text3); }
</style>
