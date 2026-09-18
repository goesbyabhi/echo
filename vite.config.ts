import { svelte } from '@sveltejs/vite-plugin-svelte'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: Plugin[] = [...svelte()]
  if (mode === 'stats') {
    plugins.push(...(visualizer({ emitFile: true, filename: 'stats.html', gzipSize: true, template: 'treemap' }) as unknown as Plugin[]))
  }
  return {
    plugins,
    build: {
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@opencode-ai/sdk')) return 'sdk'
            if (id.includes('@fontsource-variable')) return 'fonts'
            if (id.includes('/node_modules/marked/') || id.includes('/node_modules/dompurify/')) return 'markdown'
            if (id.includes('/node_modules/highlight.js/')) return 'highlight'
            if (id.includes('/node_modules/diff/')) return 'diff'
          },
        },
      },
    },
  }
})