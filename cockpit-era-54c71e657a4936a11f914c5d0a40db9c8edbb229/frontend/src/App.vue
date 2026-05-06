<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import MainTabsNav from './components/MainTabsNav.vue'
import PinOverlay from './components/PinOverlay.vue'
import GlobalToast from './components/GlobalToast.vue'
import { useEraStore } from './stores/era'

const store = useEraStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'today', label: "Aujourd'hui", path: '/today', icon: '☀️' },
  { key: 'mandats', label: 'Mandats', path: '/mandats', icon: '📋' },
  { key: 'acquereurs', label: 'Acquéreurs', path: '/acquereurs', icon: '👥' },
  { key: 'rdv', label: 'RDV', path: '/rdv', icon: '📅' },
  { key: 'terrain', label: 'Terrain', path: '/terrain', icon: '🗺️' },
  { key: 'notes', label: 'Notes', path: '/notes', icon: '📝' },
  { key: 'settings', label: 'Réglages', path: '/settings', icon: '⚙️' },
]

const activeTab = computed(() => route.path.split('/')[1] || 'today')

onMounted(async () => {
  await store.boot()
  if (route.path === '/') {
    router.replace('/today')
  }
})
</script>

<template>
  <AppHeader />
  <main class="main">
    <RouterView v-slot="{ Component }">
      <component :is="Component" class="panel on" />
    </RouterView>
  </main>
  <MainTabsNav :tabs="tabs" :active-tab="activeTab" />
  <PinOverlay />
  <GlobalToast />
</template>
