import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          setupFiles: ['tests/setup-ui.ts'],
          include: ['tests/**/*.test.tsx'],
        },
      },
    ],
  },
});
