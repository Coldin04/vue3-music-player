// vite.config.mjs
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  root: path.resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
      output: {
        format: 'esm', // 保持输出格式为 CommonJS
        entryFileNames: 'bundle.js',
      },
    },
  },
});