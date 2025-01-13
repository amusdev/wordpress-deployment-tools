import { path as appRootPath } from 'app-root-path';
import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

import { getWpConfig, getWpConfigByPath, setupInitialWpConfig } from './config';

describe('getWpConfigByPath()', () => {
  test('should call getWpConfig()', () => {
    const result = getWpConfigByPath(path.join(appRootPath, 'test/wordpress'));
    expect(result.dbHost).toBe('localhost');
    expect(result.dbPort).toBe(3306);
    expect(result.dbUser).toBe('username_here');
    expect(result.database).toBe('database_name_here');
  });
});

describe('getWpConfig()', () => {
  test('parse wordpress sample config and get correct result', () => {
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
  test('parse wordpress config and get correct result', () => {
    const wpConfigSample = fs.readFileSync(
      path.join(appRootPath, 'test/wordpress/wp-config.php'),
      'utf8'
    );
    const result = getWpConfig(wpConfigSample);
    expect(result.dbHost).toBe('database.host.local');
    expect(result.dbPort).toBe(3389);
    expect(result.dbUser).toBe('username');
    expect(result.database).toBe('new_database');
  });
});

describe('setupInitialWpConfig()', () => {
  test('should inject correct parameters', () => {
    const wpConfigSample = fs.readFileSync(
      path.join(appRootPath, 'test/wordpress/wp-config-sample.php'),
      'utf8'
    );
    const wpConfig = fs.readFileSync(
      path.join(appRootPath, 'test/wordpress/wp-config.php'),
      'utf8'
    );
    const newWpConfig = setupInitialWpConfig(
      wpConfigSample,
      'database.host.local',
      3389,
      'username',
      'password',
      'new_database',
      'test_passphrase'
    );
    expect(newWpConfig).equal(wpConfig);
  });
});
