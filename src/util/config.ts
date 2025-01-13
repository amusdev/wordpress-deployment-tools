import fs from 'fs';
import { Engine } from 'php-parser';

import { getWpConfigPath } from './path';

export function getWpConfigByPath(wpInstalledPath: string, options?: any) {
  const fileContent = fs.readFileSync(getWpConfigPath(wpInstalledPath), 'utf8');
  return getWpConfig(fileContent, options);
}

export function getWpConfig(fileContent: string, options?: any) {
  const engine = new Engine(options);
  const { children } = engine.parseCode(fileContent, '');
  let database,
    dbHost = 'localhost',
    dbPort = 3306,
    dbUser;
  for (const child of children as any[]) {
    if (child.expression?.what?.name === 'define') {
      const [name, value] = child.expression.arguments;
      if (name.kind === 'string' && value.kind === 'string') {
        if (name.value === 'DB_NAME') {
          database = value.value as string;
        }
        if (name.value === 'DB_HOST') {
          const [host, port] = value.value.split(':');
          dbHost = host ?? 'localhost';
          if (port !== undefined) {
            dbPort = parseInt(port);
          }
        }
        if (name.value === 'DB_USER') {
          dbUser = value.value as string;
        }
      }
    }
  }
  return { database, dbHost, dbPort, dbUser };
}

export function setupInitialWpConfig(
  fileContent: string,
  host: string,
  port: number,
  username: string,
  password: string,
  database: string,
  passphrase: string
) {
  return fileContent
    .replaceAll(/put your unique phrase here/g, passphrase)
    .replace('database_name_here', database)
    .replace('username_here', username)
    .replace('password_here', password)
    .replace('localhost', port === 3306 ? host : `${host}:${port}`);
}

export function setupInitialPHPConfig(fileContent: string, phpVer: string, siteIdentify: string) {
  return fileContent
    .replace('[www]', `[${siteIdentify}]`)
    .replace('user = www-data', `user = ${siteIdentify}`)
    .replace('group = www-data', `group = ${siteIdentify}`)
    .replace(
      `listen = /run/php/php${phpVer}-fpm.sock`,
      `listen = /run/php/php${phpVer}-fpm-$pool.sock`
    )
    .replace(';slowlog = log/$pool.log.slow', `slowlog = /var/log/php${phpVer}-fpm-$pool.log.slow`)
    .replace(
      ';php_admin_value[error_log] = /var/log/fpm-php.www.log',
      `php_admin_value[error_log] = /var/log/php${phpVer}-fpm-$pool.log.error`
    )
    .replace(';php_admin_flag[log_errors] = on', 'php_admin_flag[log_errors] = on');
}

export function getNginxVirtualHostConfig(host: string, altHost: string) {
  const config = fs.readFileSync('../template/nginx-virtual-host.conf', { encoding: 'utf8' });
  return config.replace(/{{host}}/g, host).replace(/{{alt_host}}/g, altHost);
}
