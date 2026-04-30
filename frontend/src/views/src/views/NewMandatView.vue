```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const router = useRouter()

const adresse = ref('')
const vendeur = ref('')
const tel = ref('')
const prix = ref('')
const type = ref('Appartement')

function save() {
  if (!adresse.value || !vendeur.value) {
    alert('Adresse et vendeur obligatoires')
    return
  }

  store.mandats.unshift({
    id: Math.random().toString(36).slice(2),
    adresse: adresse.value,
    vendeur: vendeur.value,
    tel: tel.value,
    prix: prix.value,
    type: type.value,
    statut: 'estimation',
    date: new Date().toISOString().slice(0, 10)
  })

  store.saveAll()
  store.toast('✅ Mandat ajouté')

  router.push('/mandats')
}
</script>

<template>
  <section class="panel">
    <h2>Nouveau mandat</h2>

    <div class="form">
      <input v-model="adresse" placeholder="Adresse du bien" />
      <input v-model="vendeur" placeholder="Nom du vendeur" />
      <input v-model="tel" placeholder="Téléphone" inputmode="numeric" />
      <input v-model="prix" placeholder="Prix estimé (€)" />

      <select v-model="type">
        <option>Appartement</option>
        <option>Maison</option>
        <option>Terrain</option>
      </select>

      <button @click="save">💾 Enregistrer</button>
    </div>
  </section>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}
input, select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
button {
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: black;
  color: white;
  font-weight: 600;
}
</style>
```
