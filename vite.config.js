import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@kernel': resolve(__dirname, 'src/kernel'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@apps': resolve(__dirname, 'src/apps'),
      '@services': resolve(__dirname, 'src/services'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@fs': resolve(__dirname, 'src/filesystem'),
      '@ws': resolve(__dirname, 'src/window-system'),
    }
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          core: [
            './src/core/boot.js',
            './src/core/event-bus.js',
            './src/core/config.js'
          ]
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
