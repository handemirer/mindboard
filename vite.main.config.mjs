import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

const builtins = ['electron', 'electron/main', ...builtinModules.flatMap(m => [m, `node:${m}`])];

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: builtins,
    },
  },
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
