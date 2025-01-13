import shell from 'shelljs';

import { getPHPErrorLogPath } from './path';

import PHPVersionNotFoundError from '@/error/PHPVersionNotFoundError';
import RestartServiceError from '@/error/RestartServiceError';

export function isPHPInstalled() {
  return shell.which('php');
}

export function isMySQLInstalled() {
  return shell.which('mysqld');
}

export function restartNginxService() {
  if (shell.exec(`systemctl restart nginx`).code !== 0) {
    throw new RestartServiceError('nginx');
  }
}

export function restartPHPFPMService(phpVer: string) {
  if (shell.exec(`systemctl restart php${phpVer}-fpm`).code !== 0) {
    throw new RestartServiceError('php-fpm');
  }
}

export function createPHPErrorLogFile(phpVer: string, identity: string) {
  const path = getPHPErrorLogPath(phpVer, identity);
  shell.touch(path);
  shell.exec(`chown ${identity}:${identity} ${path}`);
}

export function setWpInstalledPathPermission(wpInstalledPath: string, identity: string) {
  shell.exec(`chown ${identity}:${identity} -R ${wpInstalledPath}`);
  shell.exec(`find ${wpInstalledPath} -type d -exec chmod 755 {} \;`);
  shell.exec(`find ${wpInstalledPath} -type f -exec chmod 644 {} \;`);
}

export function createUnixUser(identity: string) {
  if (shell.grep(identity, '/etc/passwd').code === 0) {
    return;
  }
  if (
    shell.exec(`adduser --system --no-create-home --group --disabled-login ${identity}`).code !== 0
  ) {
    throw new Error(`Failed to create the user named ${identity}`);
  }
}

export function getCurrentPHPVersion() {
  const matches = shell.exec('php -v').stdout.match(/^PHP ([0-9]\.[0-9])/);
  if (matches === null) {
    throw new PHPVersionNotFoundError('Cannot find php version using `php -v`');
  }
  return matches[0];
}
