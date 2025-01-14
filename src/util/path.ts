import fs from 'fs';
import path from 'path';

export function getUnixPath(wpInstalledPath: string, phpVer: string, identity: string) {
  return {
    wp: {
      sample: getWpSampleConfigPath(wpInstalledPath),
      config: getWpConfigPath(wpInstalledPath),
    },
    php: {
      pool: getPHPPoolDir(phpVer),
      www: getPHPWWWConfigPath(phpVer),
      host: getPHPHostConfigPath(phpVer, identity),
    },
    nginx: {
      host: getNginxHostConfigPath(identity),
    },
  };
}

export function getWpSampleConfigPath(wpInstalledPath: string) {
  return path.join(wpInstalledPath, 'wp-config-sample.php');
}

export function getWpConfigPath(wpInstalledPath: string) {
  return path.join(wpInstalledPath, 'wp-config.php');
}

export function getPHPPoolDir(phpVer: string) {
  return `/etc/php/${phpVer}/fpm/pool.d`;
}

export function getPHPWWWConfigPath(phpVer: string) {
  return `/etc/php/${phpVer}/fpm/pool.d/www.conf`;
}

export function getPHPHostConfigPath(phpVer: string, identity: string) {
  return `/etc/php/${phpVer}/fpm/pool.d/${identity}.conf`;
}

export function getNginxHostConfigPath(identity: string) {
  return path.join('/etc/nginx/sites-available', identity);
}

export function getPHPErrorLogPath(phpVer: string, identity: string) {
  return `/var/log/php${phpVer}-fpm-${identity}.log.error`;
}

export function isDirectory(path: string) {
  return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

export function isFile(path: string) {
  return fs.existsSync(path) && fs.lstatSync(path).isFile();
}
