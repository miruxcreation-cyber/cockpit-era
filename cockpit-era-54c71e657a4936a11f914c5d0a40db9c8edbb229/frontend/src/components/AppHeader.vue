<script setup lang="ts">
const today = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
</script>

<template>
  <header class="hdr">
    <div class="hdr-left">
      <span class="era-pill">ERA</span>
      <div>
        <div class="hdr-name">Cockpit</div>
        <div class="hdr-sub">{{ today }}</div>
      </div>
    </div>
    <div class="hdr-agent">Samir B.</div>
  </header>
</template>
