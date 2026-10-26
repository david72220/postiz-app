import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Tests of the pilotai fork only (upstream has no unit test runner).
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@gitroom\/nestjs-libraries\/(.*)$/, replacement: `${root}libraries/nestjs-libraries/src/$1` },
      { find: /^@gitroom\/helpers\/(.*)$/, replacement: `${root}libraries/helpers/src/$1` },
    ],
  },
  test: {
    include: ['libraries/nestjs-libraries/src/**/*.pilotai.spec.ts', 'libraries/nestjs-libraries/src/integrations/public.page.selection.spec.ts'],
  },
});
