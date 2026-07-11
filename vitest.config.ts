import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/shared/video-engine/src/**/*.test.ts', 'apps/web/api/**/*.test.{js,mjs,ts}']
  }
});
