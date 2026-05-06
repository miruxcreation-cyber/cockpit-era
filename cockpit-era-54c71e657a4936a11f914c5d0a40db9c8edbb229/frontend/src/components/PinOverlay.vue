<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEraStore } from '../stores/era'

const store = useEraStore()
const pin = ref('')
const error = ref('')

onMounted(() => store.hydratePinState())

function submit() {
  if (pin.value.length !== 4) return
  const ok = store.unlockPin(pin.value)
  if (!ok) {
    error.value = 'Code incorrect'
    pin.value = ''
    return
  }
  error.value = ''
}
</script>

<template>
  <div v-if="!store.pinUnlocked" class="pin-overlay">
    <div class="pin-box">
      <h2>Securite PIN</h2>
      <p>Entrez le code a 4 chiffres</p>
      <input v-model="pin" maxlength="4" inputmode="numeric" />
      <button @click="submit">Valider</button>
      <small>{{ error }}</small>
    </div>
  </div>
</template>
