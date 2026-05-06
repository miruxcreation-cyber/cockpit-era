<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEraStore } from '../stores/era'
import { scoreMatch } from '../composables/useMatching'
import type { Acquereur } from '../types/domain'

const store = useEraStore()

const query = ref('')
const activeFilter = ref('tous')
const showProspects = ref(false)
const sheetOpen = ref(false)
const sheetTarget = ref<Acquereur | null>(null)
const swipedId = ref<string | null>(null)

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

function matchedMandats(a: Acquereur): number {
  return store.mandats.filter(m => scoreMatch(a, m) > 35).length
}

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

function callAcq(a: Acquereur) {
  const tel = (a as any).tel
  if (tel) window.location.href = `tel:${tel}`
}

function waAcq(a: Acquereur) {
  const tel = (a as any).tel
  if (tel) window.open(`https://wa.me/${String(tel).replace(/\D/g, '')}`)
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
      <button class="btn btn-gold">+ Ajouter</button>
    </div>

    <div class="stats">
      <div class="sc"><div class="sv">{{ store.acquereurs.length }}</div><div class="sl">Total</div></div>
      <div class="sc"><div class="sv" style="color:var(--red)">{{ store.acquereurs.filter(a => ['qualifie','offre'].includes(a.statut)).length }}</div><div class="sl">Chauds</div></div>
      <div class="sc"><div class="sv" style="color:var(--orange)">{{ store.acquereurs.filter(a => a.statut === 'actif').length }}</div><div class="sl">Actifs</div></div>
      <div class="sc"><div class="sv" style="color:var(--text3)">{{ store.acquereurs.filter(a => ['prospect','inactif'].includes(a.statut)).length }}</div><div class="sl">Prospects</div></div>
    </div>

    <div class="srch"><input v-model="query" placeholder="Rechercher un acquéreur..." /></div>

    <div class="chips-bar">
      <button
        v-for="f in FILTERS" :key="f.key"
        class="chip"
        :class="{ active: activeFilter === f.key, 'chip-alert': f.key === 'relance' }"
        @click="activeFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <div v-if="toRelance.length" class="relance-banner">
      <div class="relance-title">⏰ À relancer aujourd'hui</div>
      <div v-for="a in toRelance.slice(0, 3)" :key="a.id" class="relance-row">
        <span class="relance-name">{{ a.nom }}</span>
        <span class="relance-days">+{{ daysSinceContact(a) }}j</span>
        <button class="relance-call" @click="callAcq(a)">📞 Appeler</button>
      </div>
    </div>

    <!-- CHAUDS -->
    <template v-if="chauds.length">
      <div class="sh" style="margin-top:4px">
        <div class="stitle" style="font-size:14px">🔥 Chauds</div>
        <span class="count-badge">{{ chauds.length }}</span>
      </div>
      <div class="acq-list">
        <div v-for="a in chauds" :key="a.id" class="card-outer">
          <div class="swipe-actions">
            <button class="swa swa-call" @click="callAcq(a)">📞<span>Appel</span></button>
            <button class="swa swa-wa" @click="waAcq(a)">💬<span>WA</span></button>
            <button class="swa swa-status" @click="openSheet(a)">✏️<span>Statut</span></button>
          </div>
          <div class="card" :class="{ swiped: swipedId === a.id }" @click="toggleSwipe(a.id)">
            <div v-if="daysSinceContact(a) >= 7" class="alert-bar">⚠️ Sans contact depuis {{ daysSinceContact(a) }}j</div>
            <div class="card-top">
              <div class="avatar" :class="avatarClass(a)">{{ initials(a.nom) }}</div>
              <div class="card-info">
                <div class="card-name">{{ a.nom }}</div>
                <div class="card-sub">{{ a.secteur || '—' }} · {{ a.profil || '—' }}</div>
              </div>
              <span class="badge" :class="BADGE[a.statut] || 'b-gray'" @click.stop="openSheet(a)">
                {{ statutLabel(a.statut) }} 〉
              </span>
            </div>
            <div class="card-rows">
              <div class="row"><span class="lbl">Budget</span><span class="val">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
              <div class="row"><span class="lbl">Recherche</span><span class="val">{{ a.type || '—' }}</span></div>
              <div class="row">
                <span class="lbl">Matching</span>
                <span class="val match-val">
                  <span class="dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="i <= Math.min(matchedMandats(a), 5) ? 'dot-on' : 'dot-off'"></span>
                  </span>
                  {{ matchedMandats(a) }} mandat{{ matchedMandats(a) > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="card-actions">
              <button class="act-btn" @click.stop="callAcq(a)">📞 Appel</button>
              <button class="act-btn" @click.stop="waAcq(a)">💬 WA</button>
              <button class="act-btn" @click.stop>🎯 Match</button>
              <button class="act-btn" @click.stop>📝 Note</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ACTIFS -->
    <template v-if="actifs.length">
      <div class="sh" style="margin-top:14px">
        <div class="stitle" style="font-size:14px">🟡 Actifs</div>
        <span class="count-badge">{{ actifs.length }}</span>
      </div>
      <div class="acq-list">
        <div v-for="a in actifs" :key="a.id" class="card-outer">
          <div class="swipe-actions">
            <button class="swa swa-call" @click="callAcq(a)">📞<span>Appel</span></button>
            <button class="swa swa-wa" @click="waAcq(a)">💬<span>WA</span></button>
            <button class="swa swa-status" @click="openSheet(a)">✏️<span>Statut</span></button>
          </div>
          <div class="card" :class="{ swiped: swipedId === a.id }" @click="toggleSwipe(a.id)">
            <div v-if="daysSinceContact(a) >= 7" class="alert-bar">⚠️ Sans contact depuis {{ daysSinceContact(a) }}j</div>
            <div class="card-top">
              <div class="avatar av-blue">{{ initials(a.nom) }}</div>
              <div class="card-info">
                <div class="card-name">{{ a.nom }}</div>
                <div class="card-sub">{{ a.secteur || '—' }} · {{ a.profil || '—' }}</div>
              </div>
              <span class="badge b-blue" @click.stop="openSheet(a)">{{ statutLabel(a.statut) }} 〉</span>
            </div>
            <div class="card-rows">
              <div class="row"><span class="lbl">Budget</span><span class="val">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
              <div class="row"><span class="lbl">Recherche</span><span class="val">{{ a.type || '—' }}</span></div>
              <div class="row">
                <span class="lbl">Matching</span>
                <span class="val match-val">
                  <span class="dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="i <= Math.min(matchedMandats(a), 5) ? 'dot-on' : 'dot-off'"></span>
                  </span>
                  {{ matchedMandats(a) }} mandat{{ matchedMandats(a) > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="card-actions">
              <button class="act-btn" @click.stop="callAcq(a)">📞 Appel</button>
              <button class="act-btn" @click.stop="waAcq(a)">💬 WA</button>
              <button class="act-btn" @click.stop>🎯 Match</button>
              <button class="act-btn" @click.stop>📝 Note</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- PROSPECTS -->
    <template v-if="prospects.length">
      <div class="sh" style="margin-top:14px;cursor:pointer" @click="showProspects = !showProspects">
        <div class="stitle" style="font-size:14px">🔵 Prospects</div>
        <span class="count-badge">{{ prospects.length }} {{ showProspects ? '↑' : '↓' }}</span>
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
                <span class="badge b-gray" @click.stop="openSheet(a)">{{ statutLabel(a.statut) }} 〉</span>
              </div>
              <div class="card-rows">
                <div class="row"><span class="lbl">Budget</span><span class="val">{{ a.budget ? Number(a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</span></div>
                <div class="row"><span class="lbl">Recherche</span><span class="val">{{ a.type || '—' }}</span></div>
              </div>
              <div class="card-actions">
                <button class="act-btn" @click.stop="callAcq(a)">📞 Appel</button>
                <button class="act-btn" @click.stop="waAcq(a)">💬 WA</button>
                <button class="act-btn" @click.stop>📝 Note</button>
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

  </section>
</template>

<style scoped>
.acq-view { padding-bottom: 90px; }
.chips-bar { display:flex;gap:7px;padding:0 16px 14px;overflow-x:auto;scrollbar-width:none }
.chips-bar::-webkit-scrollbar { display:none }
.chip { background:var(--surface);border:0.5px solid var(--border);border-radius:20px;padding:6px 13px;font-size:12px;font-weight:500;color:var(--text2);cursor:pointer;white-space:nowrap;transition:all .2s }
.chip.active { background:var(--gold-bg);color:var(--gold);border-color:rgba(255,214,10,0.3) }
.chip.chip-alert { color:var(--red);border-color:rgba(255,69,58,0.25) }
.chip.chip-alert.active { background:var(--red-bg) }
.count-badge { font-size:11px;background:var(--surface2);color:var(--text3);border-radius:8px;padding:2px 8px }
.relance-banner { margin:0 16px 14px;background:var(--orange-bg);border:0.5px solid rgba(255,159,10,0.25);border-radius:12px;padding:11px 14px }
.relance-title { font-size:12px;font-weight:600;color:var(--orange);margin-bottom:8px }
.relance-row { display:flex;justify-content:space-between;align-items:center;padding:4px 0 }
.relance-name { font-size:12px;flex:1 }
.relance-days { font-size:11px;color:var(--red);font-weight:600;margin-right:10px }
.relance-call { font-size:11px;color:var(--blue);background:var(--blue-bg);border:none;border-radius:7px;padding:4px 9px;cursor:pointer }
.acq-list { padding:0 16px;display:flex;flex-direction:column;gap:9px;margin-bottom:4px }
.card-outer { position:relative;border-radius:14px;overflow:hidden }
.swipe-actions { position:absolute;right:0;top:0;bottom:0;width:120px;display:flex }
.swa { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:18px;font-weight:500;border:none;cursor:pointer }
.swa span { font-size:10px }
.swa-call { background:var(--green);color:#fff }
.swa-wa { background:#25d366;color:#fff }
.swa-status { background:var(--blue);color:#fff }
.card { background:var(--surface);border-radius:14px;border:0.5px solid var(--premium-border);padding:13px;transition:transform .25s;cursor:pointer;position:relative;z-index:1 }
.card.swiped { transform:translateX(-120px);border-radius:14px 0 0 14px }
.alert-bar { font-size:10px;font-weight:600;color:var(--red);background:var(--red-bg);border-radius:6px;padding:3px 8px;margin-bottom:9px;display:inline-block }
.card-top { display:flex;align-items:flex-start;gap:10px;margin-bottom:10px }
.avatar { width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0 }
.av-red { background:var(--red-bg);color:var(--red) }
.av-blue { background:var(--blue-bg);color:var(--blue) }
.av-gray { background:var(--surface2);color:var(--text3) }
.card-info { flex:1 }
.card-name { font-size:14px;font-weight:600;margin-bottom:2px }
.card-sub { font-size:11px;color:var(--text3) }
.badge { border-radius:7px;padding:3px 9px;font-size:10px;font-weight:600;white-space:nowrap;cursor:pointer;border:none }
.b-red { background:var(--red-bg);color:var(--red) }
.b-orange { background:var(--orange-bg);color:var(--orange) }
.b-blue { background:var(--blue-bg);color:var(--blue) }
.b-green { background:var(--green-bg);color:var(--green) }
.b-gray { background:var(--surface2);color:var(--text3) }
.card-rows { border-top:0.5px solid var(--border);padding-top:9px;display:flex;flex-direction:column;gap:5px }
.row { display:flex;justify-content:space-between;font-size:12px }
.lbl { color:var(--text3) }
.val { font-weight:500 }
.match-val { display:flex;align-items:center;gap:6px }
.dots { display:flex;gap:3px }
.dot { width:7px;height:7px;border-radius:50% }
.dot-on { background:var(--green) }
.dot-off { background:var(--surface3) }
.card-actions { display:flex;gap:7px;margin-top:10px }
.act-btn { flex:1;background:var(--premium-surface);border:0.5px solid var(--border);border-radius:9px;padding:7px 0;font-size:11px;color:var(--text2);cursor:pointer }
.prospects-toggle { margin:0 16px 16px;background:var(--surface);border:0.5px solid var(--border);border-radius:12px;padding:13px;text-align:center;font-size:13px;color:var(--text2);cursor:pointer }
.sheet-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200 }
.status-sheet { position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:20px 20px 0 0;border-top:0.5px solid var(--border2);padding:12px 16px 34px;z-index:201;transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1) }
.status-sheet.open { transform:translateY(0) }
.sheet-handle { width:36px;height:4px;background:var(--surface3);border-radius:2px;margin:0 auto 14px }
.sheet-title { font-size:13px;color:var(--text2);text-align:center;margin-bottom:14px }
.sheet-options { display:flex;flex-direction:column;gap:8px }
.sheet-opt { display:flex;align-items:center;gap:10px;padding:13px;border-radius:12px;background:var(--surface2);border:0.5px solid var(--border);font-size:14px;cursor:pointer;color:var(--text) }
.sheet-opt-active { border-color:var(--gold) }
.sheet-cancel { width:100%;margin-top:8px;padding:13px;border-radius:12px;background:var(--surface2);border:none;font-size:14px;font-weight:500;color:var(--text2);cursor:pointer }
</style>
