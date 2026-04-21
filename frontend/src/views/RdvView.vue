<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEraStore } from '../stores/era'
import type { Rdv } from '../types/domain'

const store = useEraStore()

const sheetOpen = ref(false)
const sheetTarget = ref<Rdv | null>(null)

const OBJETS: Record<string, { icon: string; color: string; bg: string }> = {
  'prise de mandat': { icon: '📋', color: 'var(--gold)', bg: 'var(--gold-bg)' },
  'estimation':      { icon: '📊', color: 'var(--orange)', bg: 'var(--orange-bg)' },
  'visite':          { icon: '👁️', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'contre-visite':   { icon: '🔄', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'offre':           { icon: '💰', color: 'var(--green)', bg: 'var(--green-bg)' },
  'compromis':       { icon: '📝', color: 'var(--purple)', bg: 'var(--purple-bg)' },
  'acte':            { icon: '🏛️', color: 'var(--green)', bg: 'var(--green-bg)' },
  'découverte':      { icon: '💬', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'prospection':     { icon: '🚶', color: 'var(--text2)', bg: 'var(--surface2)' },
}

function getObjetStyle(objet?: string) {
  if (!objet) return { icon: '📅', color: 'var(--text2)', bg: 'var(--surface2)' }
  const key = Object.keys(OBJETS).find(k => objet.toLowerCase().includes(k))
  return key ? OBJETS[key] : { icon: '📅', color: 'var(--text2)', bg: 'var(--surface2)' }
}

function fmtDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d === today.toISOString().slice(0, 10)) return "Aujourd'hui"
  if (d === tomorrow.toISOString().slice(0, 10)) return 'Demain'
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isToday(d: string) {
  return d === new Date().toISOString().slice(0, 10)
}

function isSoon(d: string) {
  const diff = (new Date(d).getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 2
}

function isPast(d: string) {
  return new Date(d).getTime() < Date.now() - 86400000
}

const grouped = computed(() => {
  const map = new Map<string, Rdv[]>()
  const sorted = [...store.rdv]
    .filter(r => !r.done)
    .sort((a, b) => {
      const da = a.date + (a.heure || '00:00')
      const db = b.date + (b.heure || '00:00')
      return da.localeCompare(db)
    })
  for (const r of sorted) {
    if (!map.has(r.date)) map.set(r.date, [])
    map.get(r.date)!.push(r)
  }
  return [...map.entries()].map(([date, rdvs]) => ({ date, rdvs }))
})

const done = computed(() => store.rdv.filter(r => r.done).slice(0, 5))
const todayCount = computed(() => store.rdv.filter(r => isToday(r.date) && !r.done).length)

function markDone(r: Rdv) {
  const target = store.rdv.find(x => x.id === r.id)
  if (target) { target.done = true; store.saveAll(); store.toast('RDV marqué comme fait ✓') }
}

function openSheet(r: Rdv) { sheetTarget.value = r; sheetOpen.value = true }
function closeSheet() { sheetOpen.value = false; sheetTarget.value = null }

function callRdv(r: Rdv) {
  const tel = (r as any).tel
  if (tel) window.location.href = `tel:${tel}`
}

function waRdv(r: Rdv) {
  const tel = (r as any).tel
  if (tel) window.open(`https://wa.me/${String(tel).replace(/\D/g, '')}`)
}
</script>

<template>
  <section class="panel on rdv-view">

    <div class="sh">
      <div>
        <div class="stitle">📅 RDV</div>
        <div class="ssub">Planning de la semaine</div>
      </div>
      <button class="btn btn-gold">+ Nouveau</button>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="sc">
        <div class="sv" :style="todayCount ? 'color:var(--gold)' : ''">{{ todayCount }}</div>
        <div class="sl">Aujourd'hui</div>
      </div>
      <div class="sc">
        <div class="sv">{{ store.rdv.filter(r => !r.done).length }}</div>
        <div class="sl">À venir</div>
      </div>
      <div class="sc">
        <div class="sv" style="color:var(--green)">{{ store.rdv.filter(r => r.done).length }}</div>
        <div class="sl">Faits</div>
      </div>
      <div class="sc">
        <div class="sv" style="color:var(--orange)">{{ store.rdv.filter(r => !r.done && isPast(r.date)).length }}</div>
        <div class="sl">En retard</div>
      </div>
    </div>

    <!-- Liste groupée par date -->
    <div class="rdv-list">
      <div v-for="group in grouped" :key="group.date" class="rdv-group">

        <!-- En-tête date -->
        <div class="date-header" :class="{ 'date-today': isToday(group.date), 'date-soon': !isToday(group.date) && isSoon(group.date) }">
          <div class="date-label">{{ fmtDate(group.date) }}</div>
          <div class="date-count">{{ group.rdvs.length }} RDV</div>
        </div>

        <!-- Cards RDV -->
        <div v-for="r in group.rdvs" :key="r.id" class="rdv-card" :class="{ 'rdv-today': isToday(r.date), 'rdv-past': isPast(r.date) }">
          <div class="rdv-left">
            <div class="rdv-time">{{ r.heure || '—' }}</div>
            <div class="rdv-line"></div>
          </div>
          <div class="rdv-body">
            <div class="rdv-top">
              <div class="rdv-objet-icon" :style="{ background: getObjetStyle(r.objet).bg, color: getObjetStyle(r.objet).color }">
                {{ getObjetStyle(r.objet).icon }}
              </div>
              <div class="rdv-info">
                <div class="rdv-client">{{ r.client }}</div>
                <div class="rdv-objet-lbl">{{ r.objet || 'RDV' }}</div>
              </div>
              <button class="rdv-done-btn" @click="markDone(r)" title="Marquer comme fait">✓</button>
            </div>
            <div v-if="(r as any).lieu" class="rdv-lieu">📍 {{ (r as any).lieu }}</div>
            <div class="rdv-actions">
              <button class="rdv-act" @click="callRdv(r)">📞</button>
              <button class="rdv-act" @click="waRdv(r)">💬</button>
              <button class="rdv-act" @click="openSheet(r)">✏️</button>
              <button class="rdv-act rdv-act-done" @click="markDone(r)">✓ Fait</button>
            </div>
          </div>
        </div>

      </div>

      <!-- RDV faits récemment -->
      <div v-if="done.length" class="rdv-group">
        <div class="date-header date-done">
          <div class="date-label">✅ Récemment faits</div>
          <div class="date-count">{{ done.length }}</div>
        </div>
        <div v-for="r in done" :key="r.id" class="rdv-card rdv-card-done">
          <div class="rdv-left">
            <div class="rdv-time" style="color:var(--text3)">{{ r.heure }}</div>
            <div class="rdv-line" style="opacity:.3"></div>
          </div>
          <div class="rdv-body">
            <div class="rdv-top">
              <div class="rdv-info">
                <div class="rdv-client" style="color:var(--text2);text-decoration:line-through">{{ r.client }}</div>
                <div class="rdv-objet-lbl">{{ r.objet }} · {{ fmtDate(r.date) }}</div>
              </div>
              <span class="badge b-green" style="font-size:10px">✓ Fait</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vide -->
      <div v-if="!grouped.length && !done.length" class="rdv-empty">
        <div style="font-size:32px;margin-bottom:8px">📅</div>
        <div style="font-weight:600;margin-bottom:4px">Aucun RDV à venir</div>
        <div style="font-size:12px;color:var(--text3)">Appuyez sur + Nouveau pour en créer un</div>
      </div>
    </div>

    <!-- Sheet détail RDV -->
    <div v-if="sheetOpen" class="sheet-overlay" @click="closeSheet"></div>
    <div class="status-sheet" :class="{ open: sheetOpen }">
      <div class="sheet-handle"></div>
      <div v-if="sheetTarget" style="padding:0 4px">
        <div class="sheet-title">{{ sheetTarget.client }}</div>
        <div style="font-size:12px;color:var(--text3);text-align:center;margin-bottom:16px">
          {{ fmtDate(sheetTarget.date) }} · {{ sheetTarget.heure }} · {{ sheetTarget.objet }}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="sheet-opt" @click="callRdv(sheetTarget!);closeSheet()">📞 Appeler</button>
          <button class="sheet-opt" @click="waRdv(sheetTarget!);closeSheet()">💬 WhatsApp</button>
          <button class="sheet-opt" style="color:var(--green)" @click="markDone(sheetTarget!);closeSheet()">✓ Marquer comme fait</button>
          <button class="sheet-opt" style="color:var(--red)" @click="closeSheet()">🗑️ Supprimer</button>
        </div>
      </div>
      <button class="sheet-cancel" @click="closeSheet">Annuler</button>
    </div>

  </section>
</template>

<style scoped>
.rdv-view { padding-bottom: 90px; }
.rdv-list { padding: 0 16px; display: flex; flex-direction: column; gap: 0; }
.rdv-group { margin-bottom: 20px; }
.date-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 10px; border-bottom: 0.5px solid var(--border); margin-bottom: 10px; }
.date-today { border-bottom-color: var(--gold); }
.date-soon { border-bottom-color: var(--orange); }
.date-done { border-bottom-color: var(--green); opacity: .6; }
.date-label { font-size: 13px; font-weight: 600; }
.date-today .date-label { color: var(--gold); }
.date-soon .date-label { color: var(--orange); }
.date-count { font-size: 11px; background: var(--surface2); color: var(--text3); border-radius: 8px; padding: 2px 8px; }
.rdv-card { display: flex; gap: 10px; margin-bottom: 10px; }
.rdv-card-done { opacity: .5; }
.rdv-left { display: flex; flex-direction: column; align-items: center; width: 42px; flex-shrink: 0; padding-top: 2px; }
.rdv-time { font-size: 12px; font-weight: 600; color: var(--text2); white-space: nowrap; }
.rdv-today .rdv-time { color: var(--gold); }
.rdv-line { width: 1px; background: var(--border); flex: 1; margin-top: 6px; min-height: 20px; }
.rdv-body { flex: 1; background: var(--surface); border-radius: 12px; border: 0.5px solid var(--premium-border); padding: 11px 13px; }
.rdv-today .rdv-body { border-color: rgba(255,214,10,0.2); background: rgba(255,214,10,0.03); }
.rdv-top { display: flex; align-items: flex-start; gap: 10px; }
.rdv-objet-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.rdv-info { flex: 1; }
.rdv-client { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.rdv-objet-lbl { font-size: 11px; color: var(--text3); }
.rdv-done-btn { background: var(--green-bg); color: var(--green); border: none; border-radius: 8px; width: 28px; height: 28px; font-size: 14px; cursor: pointer; flex-shrink: 0; }
.rdv-lieu { font-size: 11px; color: var(--text3); margin-top: 6px; }
.rdv-actions { display: flex; gap: 6px; margin-top: 9px; padding-top: 8px; border-top: 0.5px solid var(--border); }
.rdv-act { background: var(--surface2); border: none; border-radius: 8px; padding: 5px 10px; font-size: 13px; cursor: pointer; }
.rdv-act-done { flex: 1; background: var(--green-bg); color: var(--green); font-size: 12px; font-weight: 600; }
.rdv-empty { text-align: center; padding: 48px 16px; color: var(--text2); }
.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; }
.status-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-radius: 20px 20px 0 0; border-top: 0.5px solid var(--border2); padding: 12px 16px 34px; z-index: 201; transform: translateY(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); }
.status-sheet.open { transform: translateY(0); }
.sheet-handle { width: 36px; height: 4px; background: var(--surface3); border-radius: 2px; margin: 0 auto 14px; }
.sheet-title { font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 4px; }
.sheet-opt { display: flex; align-items: center; gap: 10px; padding: 13px; border-radius: 12px; background: var(--surface2); border: 0.5px solid var(--border); font-size: 14px; cursor: pointer; color: var(--text); width: 100%; }
.sheet-cancel { width: 100%; margin-top: 8px; padding: 13px; border-radius: 12px; background: var(--surface2); border: none; font-size: 14px; font-weight: 500; color: var(--text2); cursor: pointer; }
</style>
