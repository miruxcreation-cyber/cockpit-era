<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  badge?: string
}>()
</script>

<template>
  <article class="card">
    <div class="card-top">
      <div>
        <div class="card-ttl">{{ title }}</div>
        <div v-if="subtitle" class="card-sub">{{ subtitle }}</div>
      </div>
      <slot name="badge">
        <span v-if="badge" class="badge b-gray">{{ badge }}</span>
      </slot>
    </div>
    <slot name="rows" />
    <div class="card-ft">
      <slot name="footerLeft">
        <span class="muted">Cockpit ERA</span>
      </slot>
      <div class="card-actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </article>
</template>
