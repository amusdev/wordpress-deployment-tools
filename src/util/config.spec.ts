import { path as appRootPath } from 'app-root-path';
import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

import { getWpConfig, getWpConfigByPath } from './config';

describe('getWpConfigByPath()', () => {
  test('should call getWpConfig()', () => {
    const result = getWpConfigByPath(path.join(appRootPath, 'test/wordpress'));
    console.log(result);
  });
});

describe('getWpConfig()', () => {
  test('parse wordpress config and get correct result', () => {
    const wpConfigSample = fs.readFileSync(
      path.join(appRootPath, 'test/wordpress/wp-config-sample.php'),
      'utf8'
    );
    const result = getWpConfig(wpConfigSample);
    expect(result.dbHost).toBe('localhost');
    expect(result.dbPort).toBe(3306);
    expect(result.dbUser).toBe('username_here');
    expect(result.database).toBe('database_name_here');
  });
});
