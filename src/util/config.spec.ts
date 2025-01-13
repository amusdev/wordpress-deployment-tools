import { path as appRootPath } from 'app-root-path';
import fs from 'fs';
import { parse } from 'ini';
import path from 'path';
import { describe, expect, test } from 'vitest';

import {
  getNginxVirtualHostConfig,
  getWpConfig,
  getWpConfigByPath,
  setupInitialPHPConfig,
  setupInitialWpConfig,
} from './config';

import PHPIdentifyMalformatError from '@/error/PHPIdentifyMalformatError';

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

describe('setupInitialPHPConfig()', () => {
  test('should throw malformat error', () => {
    const phpWWWConfigSample = fs.readFileSync(
      path.join(appRootPath, 'test/php/8.1/fpm/pool.d/www.conf'),
      'utf8'
    );
    const siteIdentify = 'my.site';
    const phpVer = '8.1';
    expect(() => setupInitialPHPConfig(phpWWWConfigSample, phpVer, siteIdentify)).toThrowError(
      PHPIdentifyMalformatError
    );
  });
  test('should inject correct parameters', () => {
    const phpWWWConfigSample = fs.readFileSync(
      path.join(appRootPath, 'test/php/8.1/fpm/pool.d/www.conf'),
      'utf8'
    );
    const siteIdentify = 'my_site';
    const phpVer = '8.1';
    const newConfig = setupInitialPHPConfig(phpWWWConfigSample, phpVer, siteIdentify);
    const ini = parse(newConfig);
    expect(ini.www).not.toBeDefined();
    expect(ini.my_site).toBeDefined();
    expect(ini.my_site.user).toBe(siteIdentify);
    expect(ini.my_site.group).toBe(siteIdentify);
    expect(ini.my_site.listen).toBe(`/run/php/php${phpVer}-fpm-$pool.sock`);
    expect(ini.my_site.slowlog).toBe(`/var/log/php${phpVer}-fpm-$pool.log.slow`);
    expect(ini.my_site['php_admin_value[error_log]']).toBe(
      `/var/log/php${phpVer}-fpm-$pool.log.error`
    );
    expect(ini.my_site['php_admin_flag[log_errors]']).toBe('on');
  });
});

describe('getNginxVirtualHostConfig()', () => {
  test('should inject correct parameters', () => {
    const phpVer = '8.1';
    const nginxConfig = fs.readFileSync(path.join(appRootPath, 'test/nginx/my.site.conf'), 'utf8');
    const newConfig = getNginxVirtualHostConfig(phpVer, 'my.site', 'my_site');
    expect(newConfig).equal(nginxConfig);
  });
});
