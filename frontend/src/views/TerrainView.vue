<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEraStore } from '../stores/era'
import type { Secteur, Copro } from '../types/domain'

const store = useEraStore()
const activeTab = ref<'secteurs' | 'prospection'>('secteurs')
const selectedSecteur = ref<Secteur | null>(null)
const selectedCopro = ref<Copro | null>(null)


const grouped = computed(() =>
  store.secteurs.map(secteur => ({
    secteur,
    copros: store.copros.filter(c => c.secteurId === secteur.id),
    total: store.copros.filter(c => c.secteurId === secteur.id).length,
  }))
)

const coprosPourSecteur = computed(() =>
  selectedSecteur.value
    ? store.copros.filter(c => c.secteurId === selectedSecteur.value!.id)
    : []
)

function selectSecteur(s: Secteur) {
  selectedSecteur.value = s
  selectedCopro.value = null
}

function back() {
  if (selectedCopro.value) { selectedCopro.value = null; return }
  if (selectedSecteur.value) { selectedSecteur.value = null; return }
}

const totalCopros = computed(() => store.copros.length)
const totalSecteurs = computed(() => store.secteurs.length)
</script>

<template>
  <section class="panel on terrain-view">

    <!-- Breadcrumb -->
    <div v-if="selectedSecteur" class="breadcrumb" @click="back">
      ← <span>{{ selectedCopro ? selectedSecteur.nom + ' · ' + selectedCopro.adresse.split(',')[0] : selectedSecteur.nom }}</span>
    </div>

    <!-- Header -->
    <div v-if="!selectedSecteur" class="sh">
      <div>
        <div class="stitle">🗺️ Terrain</div>
        <div class="ssub">Secteurs · Copropriétés · Prospection</div>
      </div>
      <button class="btn btn-gold">+ Ajouter</button>
    </div>

    <!-- Stats globales -->
    <div v-if="!selectedSecteur" class="stats">
      <div class="sc"><div class="sv">{{ totalSecteurs }}</div><div class="sl">Secteurs</div></div>
      <div class="sc"><div class="sv">{{ totalCopros }}</div><div class="sl">Copros</div></div>
      <div class="sc"><div class="sv" style="color:var(--orange)">0</div><div class="sl">Propriétaires</div></div>
      <div class="sc"><div class="sv" style="color:var(--red)">0</div><div class="sl">Chauds</div></div>
    </div>

    <!-- Tabs -->
    <div v-if="!selectedSecteur" class="chips-bar">
      <button class="chip" :class="{ active: activeTab === 'secteurs' }" @click="activeTab = 'secteurs'">🏢 Mes secteurs</button>
      <button class="chip" :class="{ active: activeTab === 'prospection' }" @click="activeTab = 'prospection'">📬 Prospection</button>
    </div>

    <!-- VUE SECTEURS -->
    <template v-if="!selectedSecteur && activeTab === 'secteurs'">
      <div class="terrain-list">
        <div
          v-for="g in grouped" :key="g.secteur.id"
          class="secteur-card"
          @click="selectSecteur(g.secteur)"
        >
          <div class="sc-left">
            <div class="sc-icon">🏙️</div>
            <div>
              <div class="sc-name">{{ g.secteur.nom }}</div>
              <div class="sc-ville">{{ g.secteur.ville || '—' }}</div>
            </div>
          </div>
          <div class="sc-right">
            <div class="sc-stat">
              <span class="sc-num">{{ g.total }}</span>
              <span class="sc-lbl">copros</span>
            </div>
            <div class="sc-arrow">›</div>
          </div>
        </div>

        <div v-if="!grouped.length" class="terrain-empty">
          <div style="font-size:32px;margin-bottom:8px">🗺️</div>
          <div style="font-weight:600;margin-bottom:4px">Aucun secteur</div>
          <div style="font-size:12px;color:var(--text3)">Ajoutez votre premier secteur de prospection</div>
        </div>
      </div>
    </template>

    <!-- VUE PROSPECTION -->
    <template v-if="!selectedSecteur && activeTab === 'prospection'">
      <div class="terrain-list">
        <div class="prosp-tip">
          <div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:6px">💡 Stratégie</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.6">Privilégiez les <strong>non-occupants (bailleurs)</strong> — moins d'attachement émotionnel, plus réceptifs à une approche chiffrée.</div>
        </div>

        <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:10px;padding:0 2px">Par priorité de lot</div>
        <div v-for="(item, i) in [
          { icon: '🏆', label: 'T2 avec extérieur', sub: 'Liquidité maximale', color: 'var(--gold)' },
          { icon: '2️⃣', label: 'T2 avec balcon', sub: 'Primo-accédants & investisseurs', color: 'var(--orange)' },
          { icon: '3️⃣', label: 'T3 avec extérieur', sub: 'Familles & grands investisseurs', color: 'var(--blue)' },
          { icon: '4️⃣', label: 'Maison / triplex', sub: 'Biens rares, valeur exception', color: 'var(--purple)' },
          { icon: '5️⃣', label: 'Studio', sub: 'Investisseurs locatifs purs', color: 'var(--text2)' },
        ]" :key="i" class="prio-card">
          <div class="prio-rank" :style="{ color: item.color }">{{ item.icon }}</div>
          <div>
            <div style="font-size:13px;font-weight:600">{{ item.label }}</div>
            <div style="font-size:11px;color:var(--text3)">{{ item.sub }}</div>
          </div>
        </div>

        <button class="btn btn-gold" style="width:100%;margin-top:12px;padding:13px">
          ✉️ Générer un courrier aux impôts fonciers
        </button>
      </div>
    </template>

    <!-- VUE COPROS D'UN SECTEUR -->
    <template v-if="selectedSecteur && !selectedCopro">
      <div class="sh" style="padding-top:8px">
        <div>
          <div class="stitle" style="font-size:16px">{{ selectedSecteur.nom }}</div>
          <div class="ssub">{{ coprosPourSecteur.length }} copropriété{{ coprosPourSecteur.length > 1 ? 's' : '' }}</div>
        </div>
        <button class="btn btn-gold">+ Copro</button>
      </div>

      <div class="terrain-list">
        <div
          v-for="copro in coprosPourSecteur" :key="copro.id"
          class="copro-card"
          @click="selectedCopro = copro"
        >
          <div class="copro-icon">🏢</div>
          <div class="copro-info">
            <div class="copro-adresse">{{ copro.adresse }}</div>
            <div class="copro-notes" v-if="copro.notes">{{ copro.notes.slice(0, 60) }}…</div>
            <div class="copro-stats">
              <span class="badge b-gray">0 propriétaires</span>
              <span class="badge b-orange">0 à contacter</span>
            </div>
          </div>
          <div class="sc-arrow">›</div>
        </div>

        <div v-if="!coprosPourSecteur.length" class="terrain-empty">
          <div style="font-size:28px;margin-bottom:8px">🏢</div>
          <div style="font-weight:600;margin-bottom:4px">Aucune copro dans ce secteur</div>
          <button class="btn btn-gold" style="margin-top:12px;padding:10px 20px">+ Ajouter une copropriété</button>
        </div>
      </div>
    </template>

    <!-- VUE PROPRIÉTAIRES D'UNE COPRO -->
    <template v-if="selectedCopro">
      <div class="sh" style="padding-top:8px">
        <div>
          <div class="stitle" style="font-size:15px">{{ selectedCopro.adresse }}</div>
          <div class="ssub">Propriétaires et lots</div>
        </div>
        <button class="btn btn-gold">+ Propriétaire</button>
      </div>

      <div class="terrain-list">
        <div class="terrain-empty">
          <div style="font-size:28px;margin-bottom:8px">👤</div>
          <div style="font-weight:600;margin-bottom:4px">Aucun propriétaire enregistré</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:16px">Ajoutez les propriétaires depuis le règlement de copropriété ou les impôts fonciers</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-gold" style="padding:10px 20px">👤 Ajouter un propriétaire</button>
            <button class="btn" style="padding:10px 20px;background:var(--surface2);color:var(--text2);border:0.5px solid var(--border)">✉️ Demande aux impôts fonciers</button>
          </div>
        </div>
      </div>
    </template>

  </section>
</template>

<style scoped>
.terrain-view { padding-bottom: 90px; }
.breadcrumb { padding: 12px 16px; font-size: 13px; color: var(--blue); cursor: pointer; display: flex; align-items: center; gap: 6px; }
.chips-bar { display: flex; gap: 7px; padding: 0 16px 14px; }
.chip { background: var(--surface); border: 0.5px solid var(--border); border-radius: 20px; padding: 6px 13px; font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; white-space: nowrap; }
.chip.active { background: var(--gold-bg); color: var(--gold); border-color: rgba(255,214,10,0.3); }
.terrain-list { padding: 0 16px; display: flex; flex-direction: column; gap: 9px; }
.secteur-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 14px; padding: 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.secteur-card:active { background: var(--surface2); }
.sc-left { display: flex; align-items: center; gap: 12px; }
.sc-icon { font-size: 24px; }
.sc-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.sc-ville { font-size: 11px; color: var(--text3); }
.sc-right { display: flex; align-items: center; gap: 12px; }
.sc-stat { text-align: right; }
.sc-num { font-size: 18px; font-weight: 700; color: var(--gold); display: block; }
.sc-lbl { font-size: 10px; color: var(--text3); }
.sc-arrow { font-size: 20px; color: var(--text3); }
.copro-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 14px; padding: 13px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
.copro-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.copro-info { flex: 1; }
.copro-adresse { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.copro-notes { font-size: 11px; color: var(--text3); margin-bottom: 6px; }
.copro-stats { display: flex; gap: 6px; flex-wrap: wrap; }
.prosp-tip { background: var(--gold-bg); border: 0.5px solid rgba(255,214,10,0.2); border-radius: 12px; padding: 12px 14px; margin-bottom: 6px; }
.prio-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.prio-rank { font-size: 20px; flex-shrink: 0; }
.terrain-empty { text-align: center; padding: 40px 16px; color: var(--text2); }
</style>
