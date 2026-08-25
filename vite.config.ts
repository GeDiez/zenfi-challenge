import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/*
 * GitHub Pages serves a project site from `/<repo>/`, not from the domain root,
 * so the build needs a matching `base` or every emitted asset URL 404s. CI
 * supplies it from the repository name; local dev and preview stay at `/`.
 * Reading it from the environment keeps the repo name out of this file.
 */
const base = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 3005,
    strictPort: true,
  },
  preview: {
    port: 3005,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/test/**', 'src/main.tsx', '**/*.d.ts'],
    },
  },
})
