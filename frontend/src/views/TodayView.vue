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
    .sort((a, b) => (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || '')))
  return future[0] || null
})

// 🔥 Mandats à relancer
const mandatsARelancer = computed(() =>
  store.mandats
    .filter(m => {
      if (!m.lastContact) return true
      const diff = Math.floor((Date.now() - new Date(m.lastContact).getTime()) / 86400000)
      return diff >= 7
    })
    .slice(0, 3)
)

function fmtRdvDate(d: string) {
  if (d === today) return "Aujourd'hui"
  const tom = new Date()
  tom.setDate(tom.getDate() + 1)
  if (d === tom.toISOString().slice(0, 10)) return 'Demain'
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysToExpire(dateExp: string) {
  return Math.ceil((new Date(dateExp).getTime() - Date.now()) / 86400000)
}

function callAcq(a: any) {
  if (a.tel) window.location.href = `tel:${a.tel}`
}

function callMandat(m: any) {
  if (m.tel) window.location.href = `tel:${m.tel}`
}

function markRdvDone(r: any) {
  const t = store.rdv.find(x => x.id === r.id)
  if (t) {
    t.done = true
    store.saveAll()
    store.toast('RDV fait ✓')
  }
}
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
    <div class="sc" @click="router.push('/mandats')">
      <div class="sv" style="color:var(--gold)">{{ mandatsActifs.length }}</div>
      <div class="sl">Mandats</div>
    </div>

    <div class="sc" @click="router.push('/mandats')">
      <div class="sv" style="color:var(--green);font-size:13px">
        {{ caNet ? caNet.toLocaleString('fr-FR') + ' €' : '—' }}
      </div>
      <div class="sl">CA net</div>
    </div>

    <div class="sc" @click="router.push('/acquereurs')">
      <div class="sv" style="color:var(--red)">{{ chauds.length }}</div>
      <div class="sl">Chauds</div>
    </div>

    <div class="sc" @click="router.push('/rdv')">
      <div class="sv" style="color:var(--blue)">{{ rdvAujourdhui.length }}</div>
      <div class="sl">RDV</div>
    </div>
  </div>

  <!-- RDV -->
  <template v-if="rdvAujourdhui.length">
    <div class="section-head">
      <span class="section-title">📅 RDV aujourd'hui</span>
    </div>

    <div class="block-list">
      <div v-for="r in rdvAujourdhui" :key="r.id" class="today-card">
        <div class="tc-body">
          <div class="tc-name">{{ r.client }}</div>
          <div class="tc-sub">{{ r.heure }}</div>
        </div>

        <button class="tca" @click="callAcq(r)">📞</button>
        <button class="tca tca-green" @click="markRdvDone(r)">✓</button>
      </div>
    </div>
  </template>

  <!-- RELANCES ACQUEREURS -->
  <template v-if="aRelancer.length">
    <div class="section-head">
      <span class="section-title">⏰ À relancer</span>
    </div>

    <div class="block-list">
      <div v-for="a in aRelancer" :key="a.id" class="today-card">
        <div class="tc-body">
          <div class="tc-name">{{ a.nom }}</div>
        </div>

        <button class="tca" @click="callAcq(a)">📞</button>
      </div>
    </div>
  </template>

  <!-- 🔥 MANDATS À RELANCER -->
  <template v-if="mandatsARelancer.length">
    <div class="section-head">
      <span class="section-title">📞 Mandats à relancer</span>
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

</section>
</template>
