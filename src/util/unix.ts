import { execaCommandSync } from 'execa';

import { getPHPErrorLogPath } from './path';

import PHPVersionNotFoundError from '@/error/PHPVersionNotFoundError';
import RestartServiceError from '@/error/RestartServiceError';

export function isPHPInstalled() {
  return execaCommandSync('which php', { reject: false }).exitCode === 0;
}

export function isMySQLInstalled() {
  return execaCommandSync('which mysqld', { reject: false }).exitCode === 0;
}

export function restartNginxService() {
  if (execaCommandSync('systemctl restart nginx', { reject: false }).exitCode !== 0) {
    throw new RestartServiceError('nginx');
  }
}

export function restartPHPFPMService(phpVer: string) {
  if (execaCommandSync(`systemctl restart php${phpVer}-fpm`, { reject: false }).exitCode !== 0) {
    throw new RestartServiceError('php-fpm');
  }
}

export function createPHPErrorLogFile(phpVer: string, identity: string) {
  const path = getPHPErrorLogPath(phpVer, identity);
  execaCommandSync(`touch ${path}`);
  execaCommandSync(`chown ${identity}:${identity} ${path}`);
}

export function setWpInstalledPathPermission(wpInstalledPath: string, identity: string) {
  execaCommandSync(`chown ${identity}:${identity} -R ${wpInstalledPath}`);
  execaCommandSync(`find ${wpInstalledPath} -type d -exec chmod 755 {} \;`);
  execaCommandSync(`find ${wpInstalledPath} -type f -exec chmod 644 {} \;`);
}

export function createUnixUser(identity: string) {
  if (execaCommandSync(`grep ${identity} /etc/passwd`, { reject: false }).exitCode === 0) {
    return;
  }
  if (
    execaCommandSync(`adduser --system --no-create-home --group --disabled-login ${identity}`, {
      reject: false,
    }).exitCode !== 0
  ) {
    throw new Error(`Failed to create the user named ${identity}`);
  }
}

export function getPHPVersionOutput() {
  return execaCommandSync('php -v', { reject: false }).stdout || '';
}

export function getCurrentPHPVersion() {
  const matches = getPHPVersionOutput().match(/^PHP ([0-9]\.[0-9])/);
  if (matches === null) {
    throw new PHPVersionNotFoundError('Cannot find php version using `php -v`');
  }
  return matches[0];
}
