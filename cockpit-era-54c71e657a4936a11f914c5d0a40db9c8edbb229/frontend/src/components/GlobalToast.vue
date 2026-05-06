<script setup lang="ts">
import { useEraStore } from '../stores/era'

const store = useEraStore()
</script>

<template>
  <div class="toasts">
    <div v-for="item in store.toasts" :key="item.id" class="toast">{{ item.text }}</div>
  </div>
</template>
