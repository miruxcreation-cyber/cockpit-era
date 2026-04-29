<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useEraStore } from '../stores/era'
import type { Secteur, Copro } from '../types/domain'

const store = useEraStore()
const activeTab = ref<'secteurs' | 'prospection'>('secteurs')
const selectedSecteur = ref<Secteur | null>(null)
const selectedCopro = ref<Copro | null>(null)

// ─── Modals ───────────────────────────────────────────────
const showModalSecteur = ref(false)
const showModalCopro = ref(false)
const showModalProprio = ref(false)

const formSecteur = reactive({ nom: '', description: '', ville: '', priorite: 'moyenne', notes: '' })
const formCopro = reactive({ adresse: '', nom: '', nbLots: '', syndic: '', annee: '', reglementCopro: 'non', lienDrive: '', notes: '' })
const formProprio = reactive({
  nom: '', prenom: '', telephone: '', email: '',
  numLot: '', typeBien: '', surface: '', etage: '',
  profil: 'inconnu', source: 'autre', statut: 'non_contacte',
  derniereRelance: '', lienDrive: '', notes: ''
})

function resetSecteur() { Object.assign(formSecteur, { nom: '', description: '', ville: '', priorite: 'moyenne', notes: '' }) }
function resetCopro() { Object.assign(formCopro, { adresse: '', nom: '', nbLots: '', syndic: '', annee: '', reglementCopro: 'non', lienDrive: '', notes: '' }) }
function resetProprio() { Object.assign(formProprio, { nom: '', prenom: '', telephone: '', email: '', numLot: '', typeBien: '', surface: '', etage: '', profil: 'inconnu', source: 'autre', statut: 'non_contacte', derniereRelance: '', lienDrive: '', notes: '' }) }

function submitSecteur() {
  if (!formSecteur.nom.trim()) return
  store.addSecteur({ nom: formSecteur.nom.trim(), description: formSecteur.description, ville: formSecteur.ville, priorite: formSecteur.priorite, notes: formSecteur.notes })
  showModalSecteur.value = false
  resetSecteur()
}

function submitCopro() {
  if (!formCopro.adresse.trim()) return
  store.addCopro({
    secteurId: selectedSecteur.value!.id,
    adresse: formCopro.adresse.trim(),
    nom: formCopro.nom,
    nbLots: formCopro.nbLots ? Number(formCopro.nbLots) : undefined,
    syndic: formCopro.syndic,
    anneeConstruction: formCopro.annee ? Number(formCopro.annee) : undefined,
    reglementCopro: formCopro.reglementCopro,
    lienDrive: formCopro.lienDrive,
    notes: formCopro.notes,
  })
  showModalCopro.value = false
  resetCopro()
}

function submitProprio() {
  if (!formProprio.nom.trim()) return
  store.addProprietaire({
    coproId: selectedCopro.value!.id,
    nom: formProprio.nom.trim(),
    prenom: formProprio.prenom,
    telephone: formProprio.telephone,
    email: formProprio.email,
    numLot: formProprio.numLot,
    typeBien: formProprio.typeBien,
    surface: formProprio.surface ? Number(formProprio.surface) : undefined,
    etage: formProprio.etage,
    profil: formProprio.profil,
    source: formProprio.source,
    statut: formProprio.statut,
    derniereRelance: formProprio.derniereRelance,
    lienDrive: formProprio.lienDrive,
    notes: formProprio.notes,
  })
  showModalProprio.value = false
  resetProprio()
}

// ─── Données computées ────────────────────────────────────
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

const proprietairesPourCopro = computed(() =>
  selectedCopro.value
    ? store.getProprietairesByCopro(selectedCopro.value.id)
    : []
)

const totalProprietaires = computed(() => store.proprietaires.length)
const totalChauds = computed(() => store.proprietaires.filter(p => p.statut === 'chaud').length)

function selectSecteur(s: Secteur) {
  selectedSecteur.value = s
  selectedCopro.value = null
}

function back() {
  if (selectedCopro.value) { selectedCopro.value = null; return }
  if (selectedSecteur.value) { selectedSecteur.value = null; return }
}
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
      <button class="btn btn-gold" @click="showModalSecteur = true">+ Ajouter</button>
    </div>

    <!-- Stats globales -->
    <div v-if="!selectedSecteur" class="stats">
      <div class="sc"><div class="sv">{{ store.secteurs.length }}</div><div class="sl">Secteurs</div></div>
      <div class="sc"><div class="sv">{{ store.copros.length }}</div><div class="sl">Copros</div></div>
      <div class="sc"><div class="sv" style="color:var(--orange)">{{ totalProprietaires }}</div><div class="sl">Propriétaires</div></div>
      <div class="sc"><div class="sv" style="color:var(--red)">{{ totalChauds }}</div><div class="sl">Chauds</div></div>
    </div>

    <!-- Tabs -->
    <div v-if="!selectedSecteur" class="chips-bar">
      <button class="chip" :class="{ active: activeTab === 'secteurs' }" @click="activeTab = 'secteurs'">🏢 Mes secteurs</button>
      <button class="chip" :class="{ active: activeTab === 'prospection' }" @click="activeTab = 'prospection'">📬 Prospection</button>
    </div>

    <!-- VUE SECTEURS -->
    <template v-if="!selectedSecteur && activeTab === 'secteurs'">
      <div class="terrain-list">
        <div v-for="g in grouped" :key="g.secteur.id" class="secteur-card" @click="selectSecteur(g.secteur)">
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
          <button class="btn btn-gold" style="margin-top:16px;padding:10px 24px" @click="showModalSecteur = true">+ Ajouter un secteur</button>
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
        <button class="btn btn-gold" @click="showModalCopro = true">+ Copro</button>
      </div>
      <div class="terrain-list">
        <div v-for="copro in coprosPourSecteur" :key="copro.id" class="copro-card" @click="selectedCopro = copro">
          <div class="copro-icon">🏢</div>
          <div class="copro-info">
            <div class="copro-adresse">{{ copro.adresse }}</div>
            <div class="copro-notes" v-if="copro.notes">{{ copro.notes.slice(0, 60) }}…</div>
            <div class="copro-stats">
              <span class="badge b-gray">{{ store.getProprietairesByCopro(copro.id).length }} propriétaires</span>
              <span class="badge b-orange">{{ store.getProprietairesByCopro(copro.id).filter(p => p.statut === 'non_contacte').length }} à contacter</span>
            </div>
          </div>
          <div class="sc-arrow">›</div>
        </div>
        <div v-if="!coprosPourSecteur.length" class="terrain-empty">
          <div style="font-size:28px;margin-bottom:8px">🏢</div>
          <div style="font-weight:600;margin-bottom:4px">Aucune copro dans ce secteur</div>
          <button class="btn btn-gold" style="margin-top:12px;padding:10px 20px" @click="showModalCopro = true">+ Ajouter une copropriété</button>
        </div>
      </div>
    </template>

    <!-- VUE PROPRIÉTAIRES D'UNE COPRO -->
    <template v-if="selectedCopro">
      <div class="sh" style="padding-top:8px">
        <div>
          <div class="stitle" style="font-size:15px">{{ selectedCopro.adresse }}</div>
          <div class="ssub">{{ proprietairesPourCopro.length }} propriétaire{{ proprietairesPourCopro.length > 1 ? 's' : '' }}</div>
        </div>
        <button class="btn btn-gold" @click="showModalProprio = true">+ Propriétaire</button>
      </div>
      <div class="terrain-list">
        <div v-for="p in proprietairesPourCopro" :key="p.id" class="proprio-card">
          <div class="proprio-avatar">{{ (p.prenom?.[0] || '') + (p.nom?.[0] || '') }}</div>
          <div class="proprio-info">
            <div class="proprio-nom">{{ p.prenom }} {{ p.nom }}</div>
            <div class="proprio-meta">
              <span v-if="p.typeBien" class="badge b-gray">{{ p.typeBien }}</span>
              <span v-if="p.numLot" class="badge b-gray">Lot {{ p.numLot }}</span>
              :class="statutBadge(p.statut || '')"{{ statutLabel(p.statut || '') }}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <a v-if="p.telephone" :href="`tel:${p.telephone}`" class="btn-icon">📞</a>
          </div>
        </div>
        <div v-if="!proprietairesPourCopro.length" class="terrain-empty">
          <div style="font-size:28px;margin-bottom:8px">👤</div>
          <div style="font-weight:600;margin-bottom:4px">Aucun propriétaire enregistré</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:16px">Ajoutez les propriétaires depuis le règlement de copropriété ou les impôts fonciers</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-gold" style="padding:10px 20px" @click="showModalProprio = true">👤 Ajouter un propriétaire</button>
            <button class="btn" style="padding:10px 20px;background:var(--surface2);color:var(--text2);border:0.5px solid var(--border)">✉️ Demande aux impôts fonciers</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         MODAL — NOUVEAU SECTEUR
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalSecteur" class="modal-overlay" @click.self="showModalSecteur = false">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">🗺️ Nouveau secteur</div>
            <button class="modal-close" @click="showModalSecteur = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="field-label">Nom du secteur *</label>
            <input v-model="formSecteur.nom" class="field-input" placeholder="ex. Résidence Les Platanes" />

            <label class="field-label">Description / rues</label>
            <input v-model="formSecteur.description" class="field-input" placeholder="ex. Avenue du Stade, rue Michelet…" />

            <label class="field-label">Ville / Code postal</label>
            <input v-model="formSecteur.ville" class="field-input" placeholder="ex. La Plaine Saint-Denis 93210" />

            <label class="field-label">Priorité</label>
            <div class="btn-group">
              <button v-for="p in [['haute','🔴 Haute'],['moyenne','🟡 Moyenne'],['basse','🟢 Basse']]" :key="p[0]"
                class="btn-seg" :class="{ active: formSecteur.priorite === p[0] }"
                @click="formSecteur.priorite = p[0]">{{ p[1] }}</button>
            </div>

            <label class="field-label">Notes</label>
            <textarea v-model="formSecteur.notes" class="field-input field-textarea" placeholder="Observations, remarques…" />
          </div>
          <div class="modal-footer">
            <button class="btn" style="flex:1;background:var(--surface2);color:var(--text2);border:0.5px solid var(--border)" @click="showModalSecteur = false">Annuler</button>
            <button class="btn btn-gold" style="flex:2" @click="submitSecteur">💾 Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════
         MODAL — NOUVELLE COPROPRIÉTÉ
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalCopro" class="modal-overlay" @click.self="showModalCopro = false">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">🏢 Nouvelle copropriété</div>
            <button class="modal-close" @click="showModalCopro = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="field-label">Adresse *</label>
            <input v-model="formCopro.adresse" class="field-input" placeholder="ex. 12 rue du Stade, 93210 Saint-Denis" />

            <label class="field-label">Nom de la résidence</label>
            <input v-model="formCopro.nom" class="field-input" placeholder="ex. Résidence Les Platanes" />

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label class="field-label">Nb lots total</label>
                <input v-model="formCopro.nbLots" class="field-input" type="number" placeholder="ex. 48" />
              </div>
              <div>
                <label class="field-label">Année construction</label>
                <input v-model="formCopro.annee" class="field-input" type="number" placeholder="ex. 1975" />
              </div>
            </div>

            <label class="field-label">Syndic</label>
            <input v-model="formCopro.syndic" class="field-input" placeholder="ex. Foncia Saint-Denis" />

            <label class="field-label">Règlement copro</label>
            <div class="btn-group">
              <button v-for="r in [['non','❌ Non dispo'],['partiel','🟡 Partiel'],['oui','✅ Disponible']]" :key="r[0]"
                class="btn-seg" :class="{ active: formCopro.reglementCopro === r[0] }"
                @click="formCopro.reglementCopro = r[0]">{{ r[1] }}</button>
            </div>

            <label class="field-label">📁 Lien Google Drive</label>
            <input v-model="formCopro.lienDrive" class="field-input" placeholder="https://drive.google.com/…" />

            <label class="field-label">Notes</label>
            <textarea v-model="formCopro.notes" class="field-input field-textarea" placeholder="Travaux votés, syndic actif, état général…" />
          </div>
          <div class="modal-footer">
            <button class="btn" style="flex:1;background:var(--surface2);color:var(--text2);border:0.5px solid var(--border)" @click="showModalCopro = false">Annuler</button>
            <button class="btn btn-gold" style="flex:2" @click="submitCopro">💾 Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════
         MODAL — NOUVEAU PROPRIÉTAIRE
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalProprio" class="modal-overlay" @click.self="showModalProprio = false">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">👤 Nouveau propriétaire</div>
            <button class="modal-close" @click="showModalProprio = false">✕</button>
          </div>
          <div class="modal-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label class="field-label">Nom *</label>
                <input v-model="formProprio.nom" class="field-input" placeholder="Dupont" />
              </div>
              <div>
                <label class="field-label">Prénom</label>
                <input v-model="formProprio.prenom" class="field-input" placeholder="Jean" />
              </div>
            </div>

            <label class="field-label">Téléphone</label>
            <input v-model="formProprio.telephone" class="field-input" type="tel" placeholder="06 xx xx xx xx" />

            <label class="field-label">Email</label>
            <input v-model="formProprio.email" class="field-input" type="email" placeholder="jean@mail.fr" />

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
              <div>
                <label class="field-label">N° lot</label>
                <input v-model="formProprio.numLot" class="field-input" placeholder="ex. 42" />
              </div>
              <div>
                <label class="field-label">Type</label>
                <select v-model="formProprio.typeBien" class="field-input field-select">
                  <option value="">—</option>
                  <option>Studio</option><option>T2</option><option>T3</option><option>T4+</option><option>Maison</option>
                </select>
              </div>
              <div>
                <label class="field-label">Surface (m²)</label>
                <input v-model="formProprio.surface" class="field-input" type="number" placeholder="48" />
              </div>
            </div>

            <label class="field-label">Profil propriétaire</label>
            <div class="btn-group">
              <button v-for="p in [['occupant','🏠 Occupant'],['bailleur','🏦 Bailleur'],['sci','🏢 SCI'],['succession','⚖️ Succession'],['inconnu','❓ Inconnu']]" :key="p[0]"
                class="btn-seg" :class="{ active: formProprio.profil === p[0] }"
                @click="formProprio.profil = p[0]">{{ p[1] }}</button>
            </div>

            <label class="field-label">Source</label>
            <select v-model="formProprio.source" class="field-input field-select">
              <option value="reglementCopro">📋 Règlement copro</option>
              <option value="pige">🔍 Pige</option>
              <option value="terrain">🚶 Picking terrain</option>
              <option value="impots">🏛️ Impôts fonciers</option>
              <option value="mailing">📬 Mailing / Mailéva</option>
              <option value="autre">📌 Autre</option>
            </select>

            <label class="field-label">Statut</label>
            <select v-model="formProprio.statut" class="field-input field-select">
              <option value="non_contacte">❓ Non contacté</option>
              <option value="courrier_envoye">📬 Courrier envoyé</option>
              <option value="contacte">📞 Contacté</option>
              <option value="interesse">🟡 Intéressé</option>
              <option value="chaud">🔥 Chaud</option>
              <option value="rdv_fixe">📅 RDV fixé</option>
              <option value="mandat_pris">✅ Mandat pris</option>
              <option value="pas_interesse">❌ Pas intéressé</option>
            </select>

            <label class="field-label">📁 Lien Drive (dossier du lot)</label>
            <input v-model="formProprio.lienDrive" class="field-input" placeholder="https://drive.google.com/…" />

            <label class="field-label">Notes</label>
            <textarea v-model="formProprio.notes" class="field-input field-textarea" placeholder="Informations utiles, historique de contact…" />
          </div>
          <div class="modal-footer">
            <button class="btn" style="flex:1;background:var(--surface2);color:var(--text2);border:0.5px solid var(--border)" @click="showModalProprio = false">Annuler</button>
            <button class="btn btn-gold" style="flex:2" @click="submitProprio">💾 Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script lang="ts">
function statutLabel(s: string) {
  const map: Record<string, string> = {
    non_contacte: '❓ Non contacté', courrier_envoye: '📬 Courrier envoyé',
    contacte: '📞 Contacté', interesse: '🟡 Intéressé', chaud: '🔥 Chaud',
    rdv_fixe: '📅 RDV', mandat_pris: '✅ Mandat', pas_interesse: '❌ Froid'
  }
  return map[s] || s
}
function statutBadge(s: string) {
  if (s === 'chaud' || s === 'rdv_fixe') return 'b-red'
  if (s === 'interesse') return 'b-orange'
  if (s === 'mandat_pris') return 'b-green'
  return 'b-gray'
}
</script>

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
.proprio-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 14px; padding: 13px; display: flex; align-items: center; gap: 12px; }
.proprio-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--gold-bg); color: var(--gold); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.proprio-info { flex: 1; }
.proprio-nom { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.proprio-meta { display: flex; gap: 5px; flex-wrap: wrap; }
.btn-icon { font-size: 18px; text-decoration: none; }
.prosp-tip { background: var(--gold-bg); border: 0.5px solid rgba(255,214,10,0.2); border-radius: 12px; padding: 12px 14px; margin-bottom: 6px; }
.prio-card { background: var(--surface); border: 0.5px solid var(--premium-border); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.prio-rank { font-size: 20px; flex-shrink: 0; }
.terrain-empty { text-align: center; padding: 40px 16px; color: var(--text2); }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: flex-end; }
.modal-sheet { background: var(--surface); border-radius: 20px 20px 0 0; width: 100%; max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 12px; border-bottom: 0.5px solid var(--border); }
.modal-title { font-size: 15px; font-weight: 700; }
.modal-close { background: var(--surface2); border: 0; width: 28px; height: 28px; border-radius: 50%; font-size: 13px; cursor: pointer; color: var(--text2); }
.modal-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.modal-footer { padding: 12px 16px; border-top: 0.5px solid var(--border); display: flex; gap: 10px; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
.field-label { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
.field-input { width: 100%; background: var(--surface2); border: 0.5px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 14px; color: var(--text1); box-sizing: border-box; }
.field-textarea { min-height: 72px; resize: none; font-family: inherit; }
.field-select { appearance: none; }
.btn-group { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-seg { background: var(--surface2); border: 0.5px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 11px; font-weight: 500; color: var(--text2); cursor: pointer; white-space: nowrap; }
.btn-seg.active { background: var(--gold-bg); color: var(--gold); border-color: rgba(255,214,10,0.4); }
</style>
