<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const router = useRouter()

const today = new Date().toISOString().slice(0, 10)
const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const rdvAujourdhui = computed(() =>
  store.rdv.filter(r => r.date === today && !r.done)
    .sort((a, b) => (a.heure || '').localeCompare(b.heure || ''))
)

const mandatsActifs = computed(() =>
  store.mandats.filter(m => !['estimation', 'expire', 'retire'].includes(m.statut))
)

const caNet = computed(() => {
  return mandatsActifs.value.reduce((sum, m) => {
    const prix = Number.parseInt(m.prix || '0', 10)
    if (!prix) return sum
    const com = m.fai ? Number.parseInt(m.fai, 10) - prix : Math.round(prix * ((m.taux || 7) / 100))
    const apresMA = m.source === 'ma' ? com * 0.75 : com
    return sum + Math.round(apresMA * 0.32 * 0.78)
  }, 0)
})

const chauds = computed(() =>
  store.acquereurs.filter(a => ['qualifie', 'offre'].includes(a.statut))
)

const aRelancer = computed(() =>
  store.acquereurs.filter(a => {
    if (!['qualifie', 'actif'].includes(a.statut)) return false
    const lc = (a as any).lastContact
    if (!lc) return true
    return Math.floor((Date.now() - new Date(lc).getTime()) / 86400000) >= 7
  }).slice(0, 3)
)

const mandatsExpirants = computed(() =>
  store.mandats.filter(m => {
    if (!m.dateExp || ['acte', 'expire', 'retire'].includes(m.statut)) return false
    const diff = Math.ceil((new Date(m.dateExp).getTime() - Date.now()) / 86400000)
    return diff >= 0 && diff <= 15
  }).sort((a, b) => new Date(a.dateExp!).getTime() - new Date(b.dateExp!).getTime())
)

const prochainRdv = computed(() => {
  const future = store.rdv
    .filter(r => !r.done && r.date >= today)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))
  return future[0] || null
})

function fmtRdvDate(d: string) {
  if (d === today) return "Aujourd'hui"
  const tom = new Date(); tom.setDate(tom.getDate() + 1)
  if (d === tom.toISOString().slice(0, 10)) return 'Demain'
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysToExpire(dateExp: string) {
  return Math.ceil((new Date(dateExp).getTime() - Date.now()) / 86400000)
}

function callClient(tel?: string) {
  if (tel) window.location.href = `tel:${tel}`
}

function waClient(tel?: string) {
  if (tel) window.open(`https://wa.me/${String(tel).replace(/\D/g, '')}`)
}

function markRdvDone(r: any) {
  const t = store.rdv.find((x: any) => x.id === r.id)
  if (t) { t.done = true; store.saveAll(); store.toast('RDV fait ✓') }
}
</script>

<template>
  <section class="today-view">

    <!-- Header date -->
    <div class="today-header">
      <div class="today-date">{{ dateLabel }}</div>
      <div class="today-greeting">Bonjour Samir 👋</div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card" @click="router.push('/mandats')">
        <div class="kpi-val gold">{{ mandatsActifs.length }}</div>
        <div class="kpi-lbl">Mandats</div>
      </div>
      <div class="kpi-card" @click="router.push('/mandats')">
        <div class="kpi-val green" style="font-size:15px">{{ caNet ? caNet.toLocaleString('fr-FR') + ' €' : '—' }}</div>
        <div class="kpi-lbl">CA net est.</div>
      </div>
      <div class="kpi-card" @click="router.push('/acquereurs')">
        <div class="kpi-val red">{{ chauds.length }}</div>
        <div class="kpi-lbl">Chauds</div>
      </div>
      <div class="kpi-card" @click="router.push('/rdv')">
        <div class="kpi-val blue">{{ rdvAujourdhui.length }}</div>
        <div class="kpi-lbl">RDV / jour</div>
      </div>
    </div>

    <!-- RDV du jour -->
    <template v-if="rdvAujourdhui.length">
      <div class="section-head">
        <span class="section-ico">📅</span>
        <span class="section-title">RDV aujourd'hui</span>
        <span class="section-badge gold-badge">{{ rdvAujourdhui.length }}</span>
      </div>
      <div class="card-list">
        <div v-for="r in rdvAujourdhui" :key="r.id" class="item-card rdv-card">
          <div class="item-left">
            <div class="item-time">{{ r.heure || '—' }}</div>
          </div>
          <div class="item-body">
            <div class="item-name">{{ r.client }}</div>
            <div class="item-sub">{{ r.objet || 'RDV' }}</div>
          </div>
          <div class="item-actions">
            <button class="act-btn" @click="callClient((r as any).tel)">📞</button>
            <button class="act-btn act-green" @click="markRdvDone(r)">✓</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Prochain RDV si rien aujourd'hui -->
    <template v-else-if="prochainRdv">
      <div class="section-head">
        <span class="section-ico">📅</span>
        <span class="section-title">Prochain RDV</span>
      </div>
      <div class="card-list">
        <div class="item-card" style="border-color:rgba(10,132,255,0.2)">
          <div class="item-left">
            <div class="item-time blue">{{ prochainRdv.heure }}</div>
            <div class="item-sub-date">{{ fmtRdvDate(prochainRdv.date) }}</div>
          </div>
          <div class="item-body">
            <div class="item-name">{{ prochainRdv.client }}</div>
            <div class="item-sub">{{ prochainRdv.objet || 'RDV' }}</div>
          </div>
          <button class="act-btn" @click="router.push('/rdv')">›</button>
        </div>
      </div>
    </template>

    <!-- À relancer -->
    <template v-if="aRelancer.length">
      <div class="section-head">
        <span class="section-ico">⏰</span>
        <span class="section-title">À relancer</span>
        <span class="section-badge red-badge">{{ aRelancer.length }}</span>
      </div>
      <div class="card-list">
        <div v-for="a in aRelancer" :key="a.id" class="item-card alert-card">
          <div class="item-body">
            <div class="item-name">{{ a.nom }}</div>
            <div class="item-sub">{{ a.secteur || '—' }} · {{ a.type || '—' }}</div>
          </div>
          <div class="item-actions">
            <button class="act-btn" @click="callClient((a as any).tel)">📞</button>
            <button class="act-btn act-wa" @click="waClient((a as any).tel)">💬</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Mandats expirants -->
    <template v-if="mandatsExpirants.length">
      <div class="section-head">
        <span class="section-ico">⚠️</span>
        <span class="section-title">Mandats expirants</span>
        <span class="section-badge orange-badge">{{ mandatsExpirants.length }}</span>
      </div>
      <div class="card-list">
        <div v-for="m in mandatsExpirants" :key="m.id" class="item-card warn-card">
          <div class="item-body">
            <div class="item-name">{{ m.adresse?.split(',')[0] }}</div>
            <div class="item-sub">{{ m.vendeur }} · Expire dans {{ daysToExpire(m.dateExp!) }}j</div>
          </div>
          <div class="item-actions">
            <button class="act-btn" @click="callClient(m.tel)">📞</button>
          </div>
        </div>
      </div>
    </template>

    <!-- État serein -->
    <div v-if="!rdvAujourdhui.length && !aRelancer.length && !mandatsExpirants.length" class="calm-state">
      <div class="calm-ico">☀️</div>
      <div class="calm-title">Rien d'urgent aujourd'hui</div>
      <div class="calm-sub">Bon terrain Samir 💪</div>
    </div>

    <!-- Raccourcis -->
    <div class="section-head" style="margin-top:8px">
      <span class="section-ico">⚡</span>
      <span class="section-title">Accès rapide</span>
    </div>
    <div class="shortcuts-grid">
      <button class="shortcut-btn" @click="router.push('/acquereurs')">
        <span class="shortcut-ico">👥</span>
        <span class="shortcut-lbl">Acquéreurs</span>
      </button>
      <button class="shortcut-btn" @click="router.push('/mandats')">
        <span class="shortcut-ico">📋</span>
        <span class="shortcut-lbl">Mandats</span>
      </button>
      <button class="shortcut-btn" @click="router.push('/rdv')">
        <span class="shortcut-ico">📅</span>
        <span class="shortcut-lbl">RDV</span>
      </button>
      <button class="shortcut-btn" @click="router.push('/terrain')">
        <span class="shortcut-ico">🗺️</span>
        <span class="shortcut-lbl">Terrain</span>
      </button>
    </div>

  </section>
</template>

<style scoped>
.today-view {
  padding: 0 16px calc(var(--nav-h) + 24px);
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.today-header {
  padding: 8px 0 16px;
}
.today-date {
  font-size: 12px;
  color: var(--text3);
  margin-bottom: 2px;
  text-transform: capitalize;
}
.today-greeting {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.kpi-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: var(--r);
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s;
}
.kpi-card:active { background: var(--surface2); }
.kpi-val {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}
.kpi-lbl {
  font-size: 9px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.gold { color: var(--gold); }
.green { color: var(--green); }
.red { color: var(--red); }
.blue { color: var(--blue); }

/* Section headers */
.section-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 0 8px;
}
.section-ico { font-size: 15px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  flex: 1;
}
.section-badge {
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  padding: 2px 9px;
}
.gold-badge { background: var(--gold-bg); color: var(--gold); }
.red-badge { background: var(--red-bg); color: var(--red); }
.orange-badge { background: var(--orange-bg); color: var(--orange); }

/* Cards */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}
.item-card {
  background: var(--surface);
  border: 0.5px solid var(--premium-border);
  border-radius: 14px;
  padding: 13px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.rdv-card {
  border-color: rgba(255, 214, 10, 0.2);
  background: rgba(255, 214, 10, 0.03);
}
.alert-card {
  border-color: rgba(255, 69, 58, 0.2);
  background: rgba(255, 69, 58, 0.03);
}
.warn-card {
  border-color: rgba(255, 159, 10, 0.2);
  background: rgba(255, 159, 10, 0.03);
}

.item-left {
  text-align: center;
  min-width: 44px;
  flex-shrink: 0;
}
.item-time {
  font-size: 14px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
}
.item-sub-date {
  font-size: 9px;
  color: var(--text3);
  margin-top: 2px;
}

.item-body { flex: 1; min-width: 0; }
.item-name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-sub {
  font-size: 11px;
  color: var(--text3);
}

.item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.act-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: var(--surface2);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.act-btn:active { background: var(--surface3); }
.act-green {
  background: var(--green-bg);
  color: var(--green);
  font-weight: 700;
}
.act-wa {
  background: rgba(37, 211, 102, 0.12);
  color: #25d366;
}

/* État calme */
.calm-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--text2);
}
.calm-ico { font-size: 36px; margin-bottom: 10px; }
.calm-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.calm-sub { font-size: 12px; color: var(--text3); }

/* Raccourcis */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.shortcut-btn {
  background: var(--surface);
  border: 0.5px solid var(--premium-border);
  border-radius: 14px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.shortcut-btn:active { background: var(--surface2); }
.shortcut-ico { font-size: 22px; line-height: 1; }
.shortcut-lbl {
  font-size: 10px;
  color: var(--text2);
  font-weight: 500;
}

@media (max-width: 400px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .shortcuts-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
