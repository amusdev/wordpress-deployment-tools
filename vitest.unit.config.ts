import { mergeConfig } from 'vitest/config';

import config from './vitest.config';

export default mergeConfig(config, {
  test: {
    name: 'unit',
    include: ['src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.spec.ts'],
    },
  },
});
