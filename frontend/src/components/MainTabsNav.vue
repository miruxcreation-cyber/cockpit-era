<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineProps<{
  tabs: Array<{ key: string; label: string; path: string; icon: string }>
  activeTab: string
}>()

const router = useRouter()
const route = useRoute()

const isNavigating = ref(false)

const handleClick = async (path: string) => {
  if (isNavigating.value) return
  if (route.path === path) return

  isNavigating.value = true

  try {
    await router.push(path)
  } finally {
    setTimeout(() => {
      isNavigating.value = false
    }, 200)
  }
}
</script>

<template>
  <nav class="tabs">
    <a
      v-for="tab in tabs"
      :key="tab.key"
      href="#"
      class="tab"
      :class="{ on: activeTab === tab.key }"
      @click.prevent="handleClick(tab.path)"
    >
      <span class="tab-ico">{{ tab.icon }}</span>
      <span class="tab-lbl">{{ tab.label }}</span>
    </a>
  </nav>
</template>
