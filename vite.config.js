import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDirectory, 'index.html'),
        menu: resolve(rootDirectory, 'menu.html'),
      },
    },
  },
});
