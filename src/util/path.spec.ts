import { describe, expect, test } from 'vitest';

import { getPHPErrorLogPath, getUnixPath, getWpSampleConfigPath } from './path';

const path = '/var/www/';
const phpVer = '8.1';
const identity = 'my.site';

describe('getUnixPath()', () => {
  test('return correct paths', () => {
    const { wp, php, nginx } = getUnixPath(path, phpVer, identity);
    expect(wp.sample).toBe('/var/www/wp-config-sample.php');
    expect(wp.config).toBe('/var/www/wp-config.php');
    expect(php.pool).toBe('/etc/php/8.1/fpm/pool.d');
    expect(php.www).toBe('/etc/php/8.1/fpm/pool.d/www.conf');
    expect(php.host).toBe('/etc/php/8.1/fpm/pool.d/my.site.conf');
    expect(nginx.host).toBe('/etc/nginx/sites-available/my.site');
  });
});

describe('getWpSampleConfigPath()', () => {
  test('return correct paths', () => {
    expect(getWpSampleConfigPath(path)).toBe('/var/www/wp-config-sample.php');
  });
});

describe('getPHPErrorLogPath()', () => {
  test('return correct paths', () => {
    expect(getPHPErrorLogPath(phpVer, identity)).toBe('/var/log/php8.1-fpm-my.site.log.error');
  });
});
