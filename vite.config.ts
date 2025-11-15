import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'
import type { PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Base public path - critical for Cloud Storage deployment
  // Uses PUBLIC_URL env var for production, defaults to '/' for dev
  base: process.env.PUBLIC_URL || '/',
  
  plugins: [
    react(),
    viteTsconfigPaths(),
    // Bundle analyzer - only in analyze mode
    ...(process.env.ANALYZE ? [visualizer({
      filename: './build/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption] : []),
  ],
  server: {
    port: 3202,
    host: true,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_AUDIO_TEXT_API_URL_ENV || 'http://localhost:3203',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: '/index.html',
        sw: '/src/service-worker.ts',
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'redux-vendor': ['redux', 'react-redux', 'redux-persist'],
        },
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'sw' ? 'service-worker.js' : 'assets/[name]-[hash].js';
        },
      }
    }
  },
  envPrefix: 'VITE_',
})
