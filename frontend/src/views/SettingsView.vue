<script setup lang="ts">
import { ref } from 'vue'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const theme = ref(localStorage.getItem('theme') || 'dark')
const confirmReset = ref(false)
const confirmWipe = ref(false)

const BAREME = [
  { label: 'Moins de 200 000 €', taux: 8 },
  { label: '200 000 — 300 000 €', taux: 7 },
  { label: '300 000 — 400 000 €', taux: 6 },
  { label: 'Plus de 400 000 €', taux: 5 },
]

function applyTheme(t: string) {
  theme.value = t
  document.documentElement.dataset.theme = t
  localStorage.setItem('theme', t)
  store.toast('Thème mis à jour')
}

async function resetDemo() {
  ;['mandats','acq','rdv_clients','notes','t_secteurs','t_copros'].forEach(k => localStorage.removeItem(k))
  await store.boot()
  store.toast('Données de démo rechargées')
  confirmReset.value = false
}

function wipeAll() {
  ;['mandats','acq','rdv_clients','notes','t_secteurs','t_copros','era_pin_code'].forEach(k => localStorage.removeItem(k))
  location.reload()
}
</script>

<template>
  <section class="panel on settings-view">

    <div class="sh">
      <div>
        <div class="stitle">⚙️ Réglages</div>
        <div class="ssub">Configuration et gestion des données</div>
      </div>
    </div>

    <!-- Profil -->
    <div class="settings-block">
      <div class="settings-block-title">👤 Mon profil</div>
      <div class="profile-card">
        <div class="profile-avatar">SB</div>
        <div>
          <div class="profile-name">Samir Belkhadra</div>
          <div class="profile-role">Agent Commercial EI — ERA Agence du Stade</div>
          <div class="profile-role" style="color:var(--text3)">La Plaine Saint-Denis · 93210</div>
        </div>
      </div>
    </div>

    <!-- Barème commission -->
    <div class="settings-block">
      <div class="settings-block-title">💰 Barème commission ERA</div>
      <div class="settings-block-sub">Taux sélectionné automatiquement selon le prix net vendeur</div>
      <div class="bareme-list">
        <div v-for="b in BAREME" :key="b.taux" class="bareme-row">
          <span class="bareme-label">{{ b.label }}</span>
          <span class="bareme-taux">{{ b.taux }}%</span>
        </div>
      </div>
      <div class="bareme-note">Part agent : 32% · URSSAF : 22% · Meilleurs Agents : -25% avant calcul</div>
    </div>

    <!-- Apparence -->
    <div class="settings-block">
      <div class="settings-block-title">🎨 Apparence</div>
      <div class="theme-row">
        <button class="theme-btn" :class="{ active: theme === 'dark' }" @click="applyTheme('dark')">🌙 Sombre</button>
        <button class="theme-btn" :class="{ active: theme === 'light' }" @click="applyTheme('light')">☀️ Clair</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="settings-block">
      <div class="settings-block-title">📊 Mes données</div>
      <div class="data-stats">
        <div class="data-stat"><span class="data-val">{{ store.mandats.length }}</span><span class="data-lbl">Mandats</span></div>
        <div class="data-stat"><span class="data-val">{{ store.acquereurs.length }}</span><span class="data-lbl">Acquéreurs</span></div>
        <div class="data-stat"><span class="data-val">{{ store.rdv.length }}</span><span class="data-lbl">RDV</span></div>
        <div class="data-stat"><span class="data-val">{{ store.notes.length }}</span><span class="data-lbl">Notes</span></div>
      </div>
    </div>

    <!-- Actions données -->
    <div class="settings-block">
      <div class="settings-block-title">🗄️ Données</div>

      <div class="settings-row" @click="confirmReset = !confirmReset">
        <div>
          <div class="settings-row-title">Réinitialiser avec données démo</div>
          <div class="settings-row-sub">Recharge les mandats et acquéreurs de départ</div>
        </div>
        <span class="settings-arrow">›</span>
      </div>
      <div v-if="confirmReset" class="confirm-zone">
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Cela effacera vos données actuelles. Continuer ?</div>
        <div style="display:flex;gap:8px">
          <button class="confirm-btn confirm-ok" @click="resetDemo">🔄 Confirmer</button>
          <button class="confirm-btn confirm-cancel" @click="confirmReset = false">Annuler</button>
        </div>
      </div>

      <div class="settings-divider"></div>

      <div class="settings-row" @click="confirmWipe = !confirmWipe" style="color:var(--red)">
        <div>
          <div class="settings-row-title" style="color:var(--red)">Effacer toutes les données</div>
          <div class="settings-row-sub">Supprime tout. Action irréversible.</div>
        </div>
        <span class="settings-arrow" style="color:var(--red)">›</span>
      </div>
      <div v-if="confirmWipe" class="confirm-zone" style="border-color:rgba(255,69,58,0.2);background:var(--red-bg)">
        <div style="font-size:12px;color:var(--red);margin-bottom:10px">⚠️ Cette action est irréversible. Toutes vos données seront perdues.</div>
        <div style="display:flex;gap:8px">
          <button class="confirm-btn" style="background:var(--red);color:#fff;border:none" @click="wipeAll">🗑️ Tout effacer</button>
          <button class="confirm-btn confirm-cancel" @click="confirmWipe = false">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Version -->
    <div style="text-align:center;padding:20px 16px;color:var(--text3);font-size:11px">
      Cockpit ERA · Samir Belkhadra · v2.0<br>Données stockées localement sur cet appareil
    </div>

  </section>
</template>

<style scoped>
.settings-view { padding-bottom: 90px; }
.settings-block { margin: 0 16px 14px; background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 14px; padding: 14px; }
.settings-block-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.settings-block-sub { font-size: 11px; color: var(--text3); margin-bottom: 10px; }
.profile-card { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
.profile-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--gold-bg); color: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
.profile-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.profile-role { font-size: 11px; color: var(--text2); }
.bareme-list { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.bareme-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--surface2); border-radius: 9px; }
.bareme-label { font-size: 12px; color: var(--text2); }
.bareme-taux { font-size: 14px; font-weight: 700; color: var(--gold); }
.bareme-note { font-size: 10px; color: var(--text3); margin-top: 8px; line-height: 1.5; }
.theme-row { display: flex; gap: 8px; margin-top: 8px; }
.theme-btn { flex: 1; padding: 10px; border-radius: 10px; background: var(--surface2); border: 0.5px solid var(--border); font-size: 13px; cursor: pointer; color: var(--text2); }
.theme-btn.active { background: var(--gold-bg); color: var(--gold); border-color: rgba(255,214,10,0.3); }
.data-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 8px; }
.data-stat { background: var(--surface2); border-radius: 10px; padding: 10px; text-align: center; }
.data-val { display: block; font-size: 18px; font-weight: 700; color: var(--gold); }
.data-lbl { font-size: 10px; color: var(--text3); }
.settings-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; cursor: pointer; }
.settings-row-title { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.settings-row-sub { font-size: 11px; color: var(--text3); }
.settings-arrow { font-size: 18px; color: var(--text3); }
.settings-divider { height: 0.5px; background: var(--border); margin: 12px 0; }
.confirm-zone { background: var(--surface2); border: 0.5px solid var(--border); border-radius: 10px; padding: 12px; margin-top: 10px; }
.confirm-btn { flex: 1; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; }
.confirm-ok { background: var(--orange-bg); color: var(--orange); border: 0.5px solid rgba(255,159,10,0.3); }
.confirm-cancel { background: var(--surface); color: var(--text2); border: 0.5px solid var(--border); }
</style>
