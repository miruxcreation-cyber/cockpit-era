<script setup lang="ts">
defineProps<{
  tabs: Array<{ key: string; label: string; path: string; icon: string }>
  activeTab: string
}>()
</script>

<template>
  <nav class="tabs-nav">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.path"
      class="nav-item"
      :class="{ active: activeTab === tab.key }"
    >
      <div class="nav-icon-container">
        <span class="nav-icon">{{ tab.icon }}</span>
        <div v-if="activeTab === tab.key" class="active-dot"></div>
      </div>
      <span class="nav-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 500px;
  height: 64px;
  background: rgba(20, 20, 24, 0.85);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--border2);
  border-radius: 24px;
  z-index: 2000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text3);
  gap: 4px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  height: 100%;
}

.nav-item.active {
  color: var(--gold);
}

.nav-icon-container {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-item.active .nav-icon-container {
  transform: translateY(-2px) scale(1.1);
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.active-dot {
  position: absolute;
  bottom: -6px;
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--gold);
}

.nav-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.active .nav-label {
  opacity: 1;
}

@media (max-width: 380px) {
  .nav-label {
    display: none;
  }
  .tabs-nav {
    height: 56px;
    bottom: 16px;
  }
}
</style>
