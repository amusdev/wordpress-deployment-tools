import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['json-summary', 'json', 'clover', 'text', 'html'],
      exclude: [
        // ****************************************************
        // copy from d.ts BaseCoverageOptions.exclude
        'coverage/**',
        'dist/**',
        '**/[.]**',
        'packages/*/test?(s)/**',
        '**/*.d.ts',
        '**/virtual:*',
        '**/__x00__*',
        '**/\x00*',
        'cypress/**',
        'test?(s)/**',
        'test?(-*).?(c|m)[jt]s?(x)',
        '**/*{.,-}{test,spec}?(-d).?(c|m)[jt]s?(x)',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/vitest.{workspace,projects}.[jt]s?(on)',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}',
        // ****************************************************
        '**/*.config.ts',
        'src/app.ts',
        'src/scripts/**/*',
        'e2e/**/*.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
