import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    pool: 'forks',
    testTimeout: 15000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['frota-backend/**', 'node_modules/**'],
  },
});
