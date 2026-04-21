<script setup lang="ts">
import { computed, ref } from 'vue'
import { scoreMatch } from '../composables/useMatching'
import { useEraStore } from '../stores/era'
import type { Mandat } from '../types/domain'

const store = useEraStore()
const query = ref('')
const pipeFilter = ref('')
const swipedId = ref<string | null>(null)
const sheetOpen = ref(false)
const sheetTarget = ref<Mandat | null>(null)
const matchSheetOpen = ref(false)
const matchTarget = ref<Mandat | null>(null)

const steps = ['estimation', 'signature', 'actif', 'visite', 'offre', 'compromis', 'acte'] as const

const statutLabels: Record<string, string> = {
  estimation: 'Estimation', signature: 'En signature', actif: 'Actif',
  visite: 'Visites', offre: 'Offre', compromis: 'Compromis', acte: 'Acte signé',
  expire: 'Expiré', retire: 'Retiré',
}
const statutBadgeClass: Record<string, string> = {
  estimation: 'b-orange', signature: 'b-purple', actif: 'b-green',
  visite: 'b-green', offre: 'b-blue', compromis: 'b-blue',
  acte: 'b-green', expire: 'b-red', retire: 'b-gray',
}

const STATUTS_MANDAT = [
  { key: 'estimation',  label: 'Estimation faite',       icon: '🟡' },
  { key: 'signature',   label: 'En cours de signature',  icon: '🟠' },
  { key: 'actif',       label: 'Mandat actif',           icon: '🟢' },
  { key: 'visite',      label: 'Visites en cours',       icon: '👁️' },
  { key: 'offre',       label: 'Offre reçue',            icon: '💬' },
  { key: 'compromis',   label: 'Compromis signé',        icon: '📝' },
  { key: 'acte',        label: 'Acte signé',             icon: '🎉' },
  { key: 'expire',      label: 'Expiré',                 icon: '⏰' },
  { key: 'retire',      label: 'Retiré',                 icon: '↩️' },
]

function fmtP(v?: string | number) {
  const n = Number.parseInt(String(v || 0), 10)
  if (!n) return '—'
  return `${n.toLocaleString('fr-FR')}€`
}

function fmtD(v?: string) {
  if (!v) return '—'
  const dt = new Date(v)
  if (Number.isNaN(dt.getTime())) return v
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcNet(m: Mandat) {
  const prix = Number.parseInt(m.prix || '0', 10)
  if (!prix) return null
  const com = m.fai ? Number.parseInt(m.fai, 10) - prix : Math.round(prix * ((m.taux || 7) / 100))
  if (com <= 0) return null
  const apresMA = m.source === 'ma' ? com * 0.75 : com
  const brut = apresMA * 0.32
  return { com: Math.round(com), net: Math.round(brut * 0.78) }
}

function matchPipe(m: Mandat) {
  if (!pipeFilter.value) return true
  if (pipeFilter.value === 'compromis') return ['compromis', 'acte'].includes(m.statut)
  return m.statut === pipeFilter.value
}

function matchQuery(m: Mandat) {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return m.adresse.toLowerCase().includes(q) || (m.vendeur || '').toLowerCase().includes(q)
}

const actifs = computed(() => {
  const activeStatuses = ['actif', 'visite', 'offre', 'compromis', 'acte', 'signature']
  return store.mandats.filter(m => activeStatuses.includes(m.statut) && matchPipe(m) && matchQuery(m))
})

const estimations = computed(() => {
  if (pipeFilter.value && pipeFilter.value !== 'estimation') return []
  return store.mandats.filter(m => m.statut === 'estimation' && matchQuery(m))
})

const allCount = computed(() => store.mandats.length)
const estimationCount = computed(() => store.mandats.filter(m => m.statut === 'estimation').length)
const signatureCount = computed(() => store.mandats.filter(m => m.statut === 'signature').length)
const actifCount = computed(() => store.mandats.filter(m => ['actif', 'visite', 'offre'].includes(m.statut)).length)
const compromisCount = computed(() => store.mandats.filter(m => ['compromis', 'acte'].includes(m.statut)).length)
const caActif = computed(() => actifs.value.reduce((sum, m) => sum + (calcNet(m)?.net || 0), 0))
const caEstim = computed(() => estimations.value.reduce((sum, m) => sum + (calcNet(m)?.net || 0), 0))

function daysToExpire(m: Mandat) {
  if (!m.dateExp || ['acte', 'expire'].includes(m.statut)) return null
  return Math.ceil((new Date(m.dateExp).getTime() - Date.now()) / 86400000)
}

function mandateType(m: Mandat) {
  const mTypes: Record<string, string> = { exclusif: '⭐ Exclusif', simple: '📄 Simple', 'co-exclusif': '👥 Co-exclusif' }
  return mTypes[m.mandat || ''] || m.mandat || '—'
}

function timelineDotClass(m: Mandat, index: number) {
  const cur = steps.indexOf((m.statut as (typeof steps)[number]) || 'estimation')
  if (m.statut === 'expire' && index === 0) return 'var(--red)'
  if (index === cur) return 'var(--gold)'
  if (index < cur) return 'rgba(52,199,89,.5)'
  return 'var(--surface2)'
}

function waLink(tel?: string) {
  if (!tel) return '#'
  return `https://wa.me/${tel.replace(/\s/g, '').replace(/^0/, '+33')}`
}

function acqMatches(m: Mandat) {
  return store.acquereurs
    .filter(a => !['compromis', 'inactif'].includes(a.statut))
    .map(a => ({ a, score: scoreMatch(a, m) }))
    .filter(x => x.score >= 30)
    .sort((a, b) => b.score - a.score)
}

function toggleSwipe(id: string) { swipedId.value = swipedId.value === id ? null : id }
function callMandat(m: Mandat) { if (m.tel) window.location.href = `tel:${m.tel}` }
function waMandat(m: Mandat) { if (m.tel) window.open(waLink(m.tel)) }
function openSheet(m: Mandat) { sheetTarget.value = m; sheetOpen.value = true; swipedId.value = null }
function closeSheet() { sheetOpen.value = false; sheetTarget.value = null }
function applyStatut(key: string) {
  if (!sheetTarget.value) return
  const target = store.mandats.find(m => m.id === sheetTarget.value!.id)
  if (target) { target.statut = key; store.saveAll(); store.toast('Statut mis à jour') }
  closeSheet()
}
function openMatchSheet(m: Mandat) { matchTarget.value = m; matchSheetOpen.value = true; swipedId.value = null }
function closeMatchSheet() { matchSheetOpen.value = false; matchTarget.value = null }
function addQuickNote(m: Mandat) {
  const ts = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  const note = `[${ts}] Suivi vendeur`
  const target = store.mandats.find(x => x.id === m.id)
  if (target) { target.notes = (target.notes ? target.notes + "\n" : "") + note; store.saveAll() }
  store.toast("Note ajoutée ✓")
}

function passerEnActif(id: string) {
  store.setMandatStatut(id, 'actif')
  store.toast("Mandat passé en actif")
}
</script>

<template>
  <section class="panel on mandats-view">
    <div class="sh">
      <div>
        <div class="stitle">📋 Mandats</div>
        <div class="ssub">Pipeline et calcul de commission</div>
      </div>
      <button class="btn btn-gold">+ Nouveau</button>
    </div>

    <!-- Pipeline -->
    <div class="pipeline">
      <button class="pipe-step" :class="{ 'active-filter': pipeFilter === '' }" @click="pipeFilter = ''">
        <div class="pipe-num">{{ allCount }}</div>
        <div class="pipe-dot" style="background:var(--text3)" />
        <div class="pipe-lbl">Tous</div>
      </button>
      <button class="pipe-step" :class="{ 'active-filter': pipeFilter === 'estimation' }" @click="pipeFilter = 'estimation'">
        <div class="pipe-num">{{ estimationCount }}</div>
        <div class="pipe-dot" style="background:var(--orange)" />
        <div class="pipe-lbl">Estim.</div>
      </button>
      <button class="pipe-step" :class="{ 'active-filter': pipeFilter === 'signature' }" @click="pipeFilter = 'signature'">
        <div class="pipe-num">{{ signatureCount }}</div>
        <div class="pipe-dot" style="background:var(--purple)" />
        <div class="pipe-lbl">Signature</div>
      </button>
      <button class="pipe-step" :class="{ 'active-filter': pipeFilter === 'actif' }" @click="pipeFilter = 'actif'">
        <div class="pipe-num">{{ actifCount }}</div>
        <div class="pipe-dot" style="background:var(--green)" />
        <div class="pipe-lbl">Actif</div>
      </button>
      <button class="pipe-step" :class="{ 'active-filter': pipeFilter === 'compromis' }" @click="pipeFilter = 'compromis'">
        <div class="pipe-num">{{ compromisCount }}</div>
        <div class="pipe-dot" style="background:var(--blue)" />
        <div class="pipe-lbl">Compromis</div>
      </button>
    </div>

    <div class="srch"><input v-model="query" placeholder="Rechercher un mandat, un vendeur..." /></div>

    <!-- Mandats actifs -->
    <div class="m-section-header">
      <div class="m-section-dot" />
      <span class="m-section-title">Mandats actifs</span>
      <span class="m-section-count">{{ actifs.length }}</span>
      <span class="ssub" style="margin-left:8px">{{ caActif ? `CA net ≈ ${caActif.toLocaleString('fr-FR')} €` : '' }}</span>
    </div>

    <div class="mandats-list">
      <div v-for="item in actifs" :key="item.id" class="card-outer">
        <div class="swipe-actions">
          <button class="swa swa-call" @click="callMandat(item)">📞<span>Appel</span></button>
          <button class="swa swa-wa" @click="waMandat(item)">💬<span>WA</span></button>
          <button class="swa swa-status" @click="openSheet(item)">✏️<span>Statut</span></button>
        </div>
        <article class="card" :class="{ swiped: swipedId === item.id }" @click="toggleSwipe(item.id)">
          <div class="card-top">
            <div style="flex:1">
              <div class="card-ttl">{{ item.adresse }}</div>
              <div v-if="item.vendeur" class="card-sub">👤 {{ item.vendeur }}</div>
            </div>
            <span class="tag">{{ mandateType(item) }}</span>
          </div>

          <div v-if="item.ref" class="card-row"><span class="card-lbl">Réf</span><span class="card-val" style="font-size:11px;color:var(--text3)">{{ item.ref }}</span></div>

          <template v-if="item.prix">
            <div class="card-row"><span class="card-lbl">🏷️ Prix FAI</span><span class="card-val" style="color:var(--text);font-weight:700">{{ fmtP(item.fai || Math.round(Number(item.prix) * (1 + (item.taux || 7) / 100))) }}</span></div>
            <div class="card-row"><span class="card-lbl">🤝 Net vendeur</span><span class="card-val" style="color:var(--green);font-weight:700">{{ fmtP(item.prix) }}</span></div>
          </template>

          <div v-if="calcNet(item)" class="net-row">
            <div>
              <div class="net-lbl">💵 Net Samir</div>
              <div class="net-detail">COM {{ fmtP(calcNet(item)?.com) }} · {{ item.taux || 7 }}%{{ item.source === 'ma' ? ' · via MA' : '' }}</div>
            </div>
            <div class="net-val">{{ fmtP(calcNet(item)?.net) }}</div>
          </div>

          <div v-if="item.surface" class="card-row"><span class="card-lbl">📐 Surface</span><span class="card-val">{{ item.surface }} m²</span></div>
          <div v-if="item.dateExp" class="card-row"><span class="card-lbl">⏳ Expire</span><span class="card-val">{{ fmtD(item.dateExp) }}</span></div>

          <!-- Timeline -->
          <div style="display:flex;align-items:center;gap:5px;margin-top:10px;padding-top:8px;border-top:0.5px solid var(--border)">
            <div v-for="(step, idx) in steps" :key="step" :style="{ width: idx === steps.indexOf(item.statut as never) ? '8px' : '6px', height: idx === steps.indexOf(item.statut as never) ? '8px' : '6px', borderRadius: '50%', background: timelineDotClass(item, idx), flexShrink: '0' }" />
            <span style="font-size:9px;color:var(--text3);margin-left:auto">{{ statutLabels[item.statut] || item.statut }}</span>
          </div>

          <!-- Footer actions -->
          <div class="card-ft">
            <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
              <span class="badge" :class="statutBadgeClass[item.statut] || 'b-gray'" style="cursor:pointer" @click.stop="openSheet(item)">
                {{ statutLabels[item.statut] || item.statut }} 〉
              </span>
              <span v-if="daysToExpire(item) !== null && (daysToExpire(item) || 0) < 0" class="badge b-red">Expiré</span>
              <span v-else-if="daysToExpire(item) !== null && (daysToExpire(item) || 0) <= 30" class="badge b-orange">⏰ {{ daysToExpire(item) }}j</span>
            </div>
            <div class="acq-act-row">
              <button class="acq-ico ai-call" :style="!item.tel ? 'opacity:.3;cursor:default' : ''" @click.stop="callMandat(item)">📞</button>
              <a v-if="item.tel" :href="waLink(item.tel)" target="_blank" class="acq-ico ai-wa" @click.stop>💬</a>
              <button v-else class="acq-ico ai-wa" style="opacity:.3;cursor:default">💬</button>
              <button class="acq-ico ai-note" @click.stop="addQuickNote(item)">📝</button>
              <button class="acq-ico ai-match" @click.stop="openMatchSheet(item)">👥</button>
              <button class="ai-more" @click.stop="openSheet(item)">✏️</button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Estimations -->
    <div class="m-section-header" style="margin-top:16px">
      <div class="m-section-dot m-section-dot-estim" />
      <span class="m-section-title">Estimations en cours</span>
      <span class="m-section-count m-section-count-estim">{{ estimations.length }}</span>
      <span class="ssub" style="margin-left:8px">{{ caEstim ? `Potentiel ≈ ${caEstim.toLocaleString('fr-FR')} €` : '' }}</span>
    </div>

    <div class="mandats-list">
      <div v-for="item in estimations" :key="item.id" class="card-outer">
        <div class="swipe-actions">
          <button class="swa swa-call" @click="callMandat(item)">📞<span>Appel</span></button>
          <button class="swa swa-wa" @click="waMandat(item)">💬<span>WA</span></button>
          <button class="swa swa-status" @click="passerEnActif(item.id)">▶<span>Activer</span></button>
        </div>
        <article class="card card-estim" :class="{ swiped: swipedId === item.id }" @click="toggleSwipe(item.id)">
          <div class="card-top">
            <div style="flex:1">
              <div class="card-ttl">{{ item.adresse }}</div>
              <div v-if="item.vendeur" class="card-sub">👤 {{ item.vendeur }}</div>
            </div>
            <span class="tag" style="background:var(--orange-bg);color:var(--orange)">🟡 Estimation</span>
          </div>

          <template v-if="item.prix">
            <div class="card-row"><span class="card-lbl">🏷️ Prix FAI estim.</span><span class="card-val" style="font-weight:700">{{ fmtP(item.fai || Math.round(Number(item.prix) * (1 + (item.taux || 7) / 100))) }}</span></div>
            <div class="card-row"><span class="card-lbl">🤝 Net vendeur</span><span class="card-val">{{ fmtP(item.prix) }}</span></div>
          </template>

          <div v-if="calcNet(item)" class="net-row" style="opacity:.8">
            <div>
              <div class="net-lbl">💵 Net Samir estimé</div>
              <div class="net-detail">si mandat signé · {{ item.taux || 7 }}%{{ item.source === 'ma' ? ' · via MA' : '' }}</div>
            </div>
            <div class="net-val">{{ fmtP(calcNet(item)?.net) }}</div>
          </div>

          <div v-if="item.surface" class="card-row"><span class="card-lbl">📐 Surface</span><span class="card-val">{{ item.surface }} m²</span></div>

          <!-- Acquéreurs potentiels -->
          <div v-if="acqMatches(item).length" style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:8px">
            <span style="font-size:9px;color:var(--text3);font-weight:600">Acq. potentiels :</span>
            <span v-for="entry in acqMatches(item).slice(0, 3)" :key="entry.a.id" class="badge b-blue">👤 {{ entry.a.nom.split(' ')[0] }}</span>
            <span v-if="acqMatches(item).length > 3" style="font-size:9px;color:var(--text3);padding:2px 6px">+{{ acqMatches(item).length - 3 }}</span>
          </div>

          <div class="card-ft" style="margin-top:10px">
            <button class="estim-btn-actif" @click.stop="passerEnActif(item.id)">▶ Passer en mandat actif</button>
            <div class="acq-act-row">
              <button class="acq-ico ai-call" :style="!item.tel ? 'opacity:.3' : ''" @click.stop="callMandat(item)">📞</button>
              <a v-if="item.tel" :href="waLink(item.tel)" target="_blank" class="acq-ico ai-wa" @click.stop>💬</a>
              <button v-else class="acq-ico ai-wa" style="opacity:.3">💬</button>
              <button class="acq-ico ai-note" @click.stop="addQuickNote(item)">📝</button>
              <button class="acq-ico" style="background:var(--green-bg);color:var(--green)" @click.stop="passerEnActif(item.id)">▶</button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Sheet statut -->
    <div v-if="sheetOpen" class="sheet-overlay" @click="closeSheet"></div>
    <div class="status-sheet" :class="{ open: sheetOpen }">
      <div class="sheet-handle"></div>
      <div class="sheet-title">{{ sheetTarget?.adresse?.split(',')[0] }} — Changer le statut</div>
      <div class="sheet-options">
        <button v-for="s in STATUTS_MANDAT" :key="s.key" class="sheet-opt" :class="{ 'sheet-opt-active': sheetTarget?.statut === s.key }" @click="applyStatut(s.key)">
          <span>{{ s.icon }}</span>
          <span>{{ s.label }}</span>
          <span v-if="sheetTarget?.statut === s.key" style="margin-left:auto;color:var(--gold)">✓</span>
        </button>
      </div>
      <button class="sheet-cancel" @click="closeSheet">Annuler</button>
    </div>

    <!-- Sheet matching -->
    <div v-if="matchSheetOpen" class="sheet-overlay" @click="closeMatchSheet"></div>
    <div class="status-sheet" :class="{ open: matchSheetOpen }" style="max-height:70vh;overflow-y:auto">
      <div class="sheet-handle"></div>
      <div class="sheet-title">👥 Acquéreurs compatibles</div>
      <div v-if="matchTarget" style="padding:0 4px">
        <div v-if="!acqMatches(matchTarget).length" style="text-align:center;padding:24px;color:var(--text3);font-size:13px">
          Aucun acquéreur compatible pour ce bien
        </div>
        <div v-for="entry in acqMatches(matchTarget)" :key="entry.a.id" class="sheet-opt" style="margin-bottom:8px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">{{ entry.a.nom }}</div>
            <div style="font-size:11px;color:var(--text3)">{{ entry.a.secteur }} · {{ entry.a.budget ? Number(entry.a.budget).toLocaleString('fr-FR') + ' €' : '—' }}</div>
          </div>
          <span class="badge b-green">Score {{ entry.score }}</span>
        </div>
      </div>
      <button class="sheet-cancel" @click="closeMatchSheet">Fermer</button>
    </div>

  </section>
</template>

<style scoped>
.mandats-view { padding-bottom: 90px; }
.mandats-list { padding: 0 16px; display: flex; flex-direction: column; gap: 9px; margin-bottom: 4px; }
.card-outer { position: relative; border-radius: 14px; overflow: hidden; }
.swipe-actions { position: absolute; right: 0; top: 0; bottom: 0; width: 120px; display: flex; }
.swa { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 16px; font-weight: 500; border: none; cursor: pointer; }
.swa span { font-size: 10px; }
.swa-call { background: var(--green); color: #fff; }
.swa-wa { background: #25d366; color: #fff; }
.swa-status { background: var(--blue); color: #fff; }
.card { background: var(--surface); border-radius: 14px; border: 0.5px solid var(--premium-border); padding: 13px; transition: transform .25s; cursor: pointer; position: relative; z-index: 1; }
.card.swiped { transform: translateX(-120px); border-radius: 14px 0 0 14px; }
.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; }
.status-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-radius: 20px 20px 0 0; border-top: 0.5px solid var(--border2); padding: 12px 16px 34px; z-index: 201; transform: translateY(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); }
.status-sheet.open { transform: translateY(0); }
.sheet-handle { width: 36px; height: 4px; background: var(--surface3); border-radius: 2px; margin: 0 auto 14px; }
.sheet-title { font-size: 13px; color: var(--text2); text-align: center; margin-bottom: 14px; }
.sheet-options { display: flex; flex-direction: column; gap: 8px; }
.sheet-opt { display: flex; align-items: center; gap: 10px; padding: 13px; border-radius: 12px; background: var(--surface2); border: 0.5px solid var(--border); font-size: 14px; cursor: pointer; color: var(--text); width: 100%; }
.sheet-opt-active { border-color: var(--gold); }
.sheet-cancel { width: 100%; margin-top: 8px; padding: 13px; border-radius: 12px; background: var(--surface2); border: none; font-size: 14px; font-weight: 500; color: var(--text2); cursor: pointer; }
</style>
