import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'legacy-index-virtual-module',
      resolveId(id) {
        if (id === 'virtual:legacy-index') return id
        return null
      },
      load(id) {
        if (id !== 'virtual:legacy-index') return null
        const legacyPath = resolve(__dirname, '../index.html')
        const html = readFileSync(legacyPath, 'utf8')
        return `export default ${JSON.stringify(html)}`
      },
    },
  ],
})
