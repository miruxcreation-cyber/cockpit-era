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
  store.mandats.filter(m => !['estimation','expire','retire'].includes(m.statut))
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
    if (!m.dateExp || ['acte','expire','retire'].includes(m.statut)) return false
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

function callAcq(a: any) { if (a.tel) window.location.href = `tel:${a.tel}` }
function callMandat(m: any) { if (m.tel) window.location.href = `tel:${m.tel}` }
function markRdvDone(r: any) {
  const t = store.rdv.find(x => x.id === r.id)>
  if (t) { t.done = true; store.saveAll(); store.toast('RDV fait ✓') }
}
const mandatsARelancer = computed(() =>
  store.mandats.slice(0, 3)
)
</script>

<template>
  <section class="panel on today-view">

    <!-- Header -->
    <div class="today-header">
      <div class="today-date">{{ dateLabel }}</div>
      <div class="today-title">Bonjour Samir 👋</div>
    </div>

    <!-- KPIs -->
    <div class="stats">
      <div class="sc" @click="router.push('/mandats')" style="cursor:pointer">
        <div class="sv" style="color:var(--gold)">{{ mandatsActifs.length }}</div>
        <div class="sl">Mandats</div>
      </div>
      <div class="sc" @click="router.push('/mandats')" style="cursor:pointer">
        <div class="sv" style="color:var(--green);font-size:13px">{{ caNet ? caNet.toLocaleString('fr-FR') + ' €' : '—' }}</div>
        <div class="sl">CA net est.</div>
      </div>
      <div class="sc" @click="router.push('/acquereurs')" style="cursor:pointer">
        <div class="sv" style="color:var(--red)">{{ chauds.length }}</div>
        <div class="sl">Chauds</div>
      </div>
      <div class="sc" @click="router.push('/rdv')" style="cursor:pointer">
        <div class="sv" style="color:var(--blue)">{{ rdvAujourdhui.length }}</div>
        <div class="sl">RDV / jour</div>
      </div>
    </div>

    <!-- RDV du jour -->
    <template v-if="rdvAujourdhui.length">
      <div class="section-head">
        <span class="section-title">📅 RDV aujourd'hui</span>
        <span class="count-badge">{{ rdvAujourdhui.length }}</span>
      </div>
      <div class="block-list">
        <div v-for="r in rdvAujourdhui" :key="r.id" class="today-card today-card-rdv">
          <div class="tc-left">
            <div class="tc-time">{{ r.heure || '—' }}</div>
          </div>
          <div class="tc-body">
            <div class="tc-name">{{ r.client }}</div>
            <div class="tc-sub">{{ r.objet || 'RDV' }}</div>
          </div>
          <div class="tc-actions">
            <button class="tca" @click="callAcq(r)">📞</button>
            <button class="tca tca-green" @click="markRdvDone(r)">✓</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Prochain RDV si rien aujourd'hui -->
    <template v-else-if="prochainRdv">
      <div class="section-head">
        <span class="section-title">📅 Prochain RDV</span>
      </div>
      <div class="block-list">
        <div class="today-card" style="border-color:rgba(10,132,255,0.2)">
          <div class="tc-left">
            <div class="tc-time" style="color:var(--blue)">{{ prochainRdv.heure }}</div>
            <div style="font-size:9px;color:var(--text3)">{{ fmtRdvDate(prochainRdv.date) }}</div>
          </div>
          <div class="tc-body">
            <div class="tc-name">{{ prochainRdv.client }}</div>
            <div class="tc-sub">{{ prochainRdv.objet || 'RDV' }}</div>
          </div>
          <button class="tca" @click="router.push('/rdv')">›</button>
        </div>
      </div>
    </template>

    <!-- Relances urgentes -->
    <template v-if="aRelancer.length">
   <div v-if="mandatsARelancer.length">
  <div class="section-head">
    <span class="section-title" @click="router.push('/mandats')" style="cursor:pointer">
      📞 Mandats à relancer
    </span>
    <span class="count-badge">{{ mandatsARelancer.length }}</span>
  </div>

  <div class="block-list">
    <div v-for="m in mandatsARelancer" :key="m.id" class="today-card">
      <div class="tc-body">
        <div class="tc-name">{{ m.adresse }}</div>
      </div>
      <button class="tca" @click="callMandat(m)">📞</button>
    </div>
  </div>
</div>

  <div class="block-list">
    <div v-for="m in mandatsARelancer" :key="m.id" class="today-card">
      <div class="tc-body">
        <div class="tc-name">{{ m.adresse }}</div>
      </div>
      <button class="tca" @click="callMandat(m)">📞</button>
    </div>
  </div>
</template>
    <!-- Mandats expirants -->
    <template v-if="mandatsExpirants.length">
      <div class="section-head">
        <span class="section-title">⚠️ Mandats expirants</span>
        <span class="count-badge" style="color:var(--orange);background:var(--orange-bg)">{{ mandatsExpirants.length }}</span>
      </div>
      <div class="block-list">
        <div v-for="m in mandatsExpirants" :key="m.id" class="today-card today-card-warn">
          <div class="tc-body">
            <div class="tc-name">{{ m.adresse?.split(',')[0] }}</div>
            <div class="tc-sub">{{ m.vendeur }} · Expire dans {{ daysToExpire(m.dateExp!) }}j</div>
          </div>
          <div class="tc-actions">
            <button class="tca" @click="callMandat(m)">📞</button>
          </div>
        </div>
      </div>
    </template>

    <!-- État serein -->
    <div v-if="!rdvAujourdhui.length && !aRelancer.length && !mandatsExpirants.length" class="today-calm">
      <div style="font-size:32px;margin-bottom:8px">☀️</div>
      <div style="font-weight:600;margin-bottom:4px">Rien d'urgent aujourd'hui</div>
      <div style="font-size:12px;color:var(--text3)">Bon terrain Samir 💪</div>
    </div>

    <!-- Raccourcis -->
    <div class="section-head" style="margin-top:8px">
      <span class="section-title">⚡ Accès rapide</span>
    </div>
    <div class="shortcuts">
      <button class="shortcut" @click="router.push('/acquereurs')">👥<span>Acquéreurs</span></button>
      <button class="shortcut" @click="router.push('/mandats')">📋<span>Mandats</span></button>
      <button class="shortcut" @click="router.push('/rdv')">📅<span>RDV</span></button>
      <button class="shortcut" @click="router.push('/terrain')">🗺️<span>Terrain</span></button>
    </div>

  </section>
</template>

<style scoped>
.today-view { padding-bottom: 90px; }
.today-header { padding: 4px 16px 12px; }
.today-date { font-size: 12px; color: var(--text3); margin-bottom: 2px; text-transform: capitalize; }
.today-title { font-size: 22px; font-weight: 700; }
.section-head { padding: 14px 16px 8px; display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text2); }
.count-badge { font-size: 11px; background: var(--surface2); color: var(--text3); border-radius: 8px; padding: 2px 8px; }
.block-list { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
.today-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 12px; padding: 12px 13px; display: flex; align-items: center; gap: 10px; }
.today-card-rdv { border-color: rgba(255,214,10,0.2); background: rgba(255,214,10,0.03); }
.today-card-alert { border-color: rgba(255,69,58,0.2); background: rgba(255,69,58,0.03); }
.today-card-warn { border-color: rgba(255,159,10,0.2); background: rgba(255,159,10,0.03); }
.tc-left { text-align: center; min-width: 40px; }
.tc-time { font-size: 13px; font-weight: 700; color: var(--gold); }
.tc-body { flex: 1; }
.tc-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.tc-sub { font-size: 11px; color: var(--text3); }
.tc-actions { display: flex; gap: 6px; }
.tca { width: 32px; height: 32px; border-radius: 9px; border: none; background: var(--surface2); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.tca-green { background: var(--green-bg); color: var(--green); font-weight: 700; }
.today-calm { text-align: center; padding: 28px 16px; color: var(--text2); }
.shortcuts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 16px; margin-bottom: 8px; }
.shortcut { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 12px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 20px; cursor: pointer; }
.shortcut span { font-size: 10px; color: var(--text2); font-weight: 500; }
</style>
