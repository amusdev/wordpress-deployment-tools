import ms from 'ms';
import { mergeConfig } from 'vitest/config';

import config from './vitest.config';

export default mergeConfig(config, {
  test: {
    name: 'e2e',
    poolOptions: {
      threads: {
        singleThread: !!process.env.CI,
      },
    },
    include: ['e2e/**/*.spec.ts'],
    setupFilesAfterEnv: ['e2e/setup.ts'],
    hookTimeout: ms('1m'),
    testTimeout: ms('30s'),
  },
});
