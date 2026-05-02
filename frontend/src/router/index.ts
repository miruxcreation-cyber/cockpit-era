import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'
import MandatsView from '../views/MandatsView.vue'
import AcquereursView from '../views/AcquereursView.vue'
import RdvView from '../views/RdvView.vue'
import TerrainView from '../views/TerrainView.vue'
import NotesView from '../views/NotesView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/today' },
    { path: '/today', component: TodayView },
    { path: '/mandats', component: MandatsView },
    { path: '/acquereurs', component: AcquereursView },
    { path: '/rdv', component: RdvView },
    { path: '/terrain', component: TerrainView },
    { path: '/notes', component: NotesView },
    { path: '/settings', component: SettingsView },
  ],
})

export default router
