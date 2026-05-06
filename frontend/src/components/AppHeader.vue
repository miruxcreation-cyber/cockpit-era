<script setup lang="ts">
import { computed } from 'vue'

const today = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})
</script>

<template>
  <header class="hdr">
    <div class="hdr-content">
      <div class="hdr-left">
        <div class="logo-circle">
          <span class="logo-txt">ERA</span>
        </div>
        <div class="hdr-brand">
          <div class="hdr-title">Cockpit <span class="v-tag">2.4</span></div>
          <div class="hdr-date">{{ today }}</div>
        </div>
      </div>
      <div class="hdr-right">
        <div class="profile-pill">
          <div class="profile-info">
            <span class="profile-name">Samir B.</span>
            <span class="profile-role">Elite Advisor</span>
          </div>
          <div class="profile-avatar">
            <span>S</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border);
}

.hdr-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  max-width: 1200px;
  margin: 0 auto;
}

.hdr-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-circle {
  background: var(--gold);
  color: #000;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: -0.05em;
  box-shadow: 0 4px 12px var(--gold-bg);
}

.hdr-brand {
  display: flex;
  flex-direction: column;
}

.hdr-title {
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: -0.02em;
}

.v-tag {
  font-size: 8px;
  background: var(--surface2);
  color: var(--gold);
  padding: 2px 5px;
  border-radius: 6px;
  font-weight: 800;
  border: 1px solid var(--premium-border);
}

.hdr-date {
  font-size: 11px;
  color: var(--text3);
  text-transform: capitalize;
  font-weight: 500;
  margin-top: 1px;
}

.hdr-right {
  display: flex;
  align-items: center;
}

.profile-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 4px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.profile-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.profile-role {
  font-size: 10px;
  color: var(--text3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profile-avatar {
  width: 32px;
  height: 32px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--gold);
}
</style>
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
