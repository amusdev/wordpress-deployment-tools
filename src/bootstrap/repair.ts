import shell from 'shelljs';

import InstallationService from '@/service/installation';
import { MySQLCredential } from '@/type/common';

export default class RepairBootstrap {
  static async handler(directory: string, domain: string, database: MySQLCredential) {
    const { phpVer } = await InstallationService.setup(
      directory,
      domain,
      domain.replaceAll(/\.|-/g, '_'),
      database
    );

    if (shell.exec(`systemctl restart nginx`).code !== 0) {
      throw new Error('Failed to restart php service');
    }

    if (shell.exec(`systemctl restart php${phpVer}-fpm`).code !== 0) {
      throw new Error('Failed to restart php service');
    }
  }
}
