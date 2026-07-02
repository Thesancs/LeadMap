import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', '.aiox-core/**', '.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.join(process.cwd(), 'src'),
    },
  },
});
