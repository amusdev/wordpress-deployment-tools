import fs from 'fs';
import { describe, expect, test, vi } from 'vitest';

import {
  getPHPErrorLogPath,
  getUnixPath,
  getWpSampleConfigPath,
  isDirectory,
  isFile,
} from './path';

const path = '/var/www/';
const phpVer = '8.1';
const identity = 'my.site';

vi.mock('fs');

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

describe('isDirectory()', () => {
  test('return true', () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);
    vi.mocked(fs.lstatSync).mockReturnValueOnce({
      isDirectory() {
        return true;
      },
    } as any);
    expect(isDirectory('/')).toBe(true);
  });
});

describe('isFile()', () => {
  test('return true', () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);
    vi.mocked(fs.lstatSync).mockReturnValueOnce({
      isFile() {
        return true;
      },
    } as any);
    expect(isFile('/')).toBe(true);
  });
});
