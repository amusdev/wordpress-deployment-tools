import cryptoRandomString from 'crypto-random-string';
import fs from 'fs';
import inquirer from 'inquirer';

import DatabaseService from './database';

import { MySQLCredential } from '@/type/common';
import {
  getNginxVirtualHostConfig,
  getWpConfigByPath,
  setupInitialPHPConfig,
  setupInitialWpConfig,
} from '@/util/config';
import { getUnixPath, isDirectory, isFile } from '@/util/path';
import {
  createPHPErrorLogFile,
  createUnixUser,
  getCurrentPHPVersion,
  setWpInstalledPathPermission,
} from '@/util/unix';

export default class InstallationService {
  static async setup(wpDir: string, domain: string, identity: string, database: MySQLCredential) {
    console.log('Setup OS and MySQL database');

    let { host, port, username, password } = database;
    let wpConfigDbUser = undefined;
    let wpDb = identity;
    const wpDbPassword = cryptoRandomString({ length: 20, type: 'ascii-printable' });

    // check php version for default
    const phpVer = getCurrentPHPVersion();

    const unixpath = getUnixPath(wpDir, phpVer, domain);

    if (!isDirectory(unixpath.php.pool)) {
      throw new Error(`PHP fpm path is not a directory at ${unixpath.php.pool}`);
    }

    if (isFile(unixpath.wp.config)) {
      const parsedWpConfig = getWpConfigByPath(unixpath.wp.config);
      if (host !== parsedWpConfig.dbHost) {
        const result = await inquirer.prompt({
          type: 'confirm',
          name: 'continueProgress',
          message: `Original ${unixpath.wp.config} DB_HOST is not same with current database configuration, continue?`,
          default: false,
        });
        if (!result.continueProgress) {
          process.exit(1);
        }
      }
      wpDb = parsedWpConfig.database || identity;
      wpConfigDbUser = parsedWpConfig.dbUser;
    }

    // setup user for php runtime
    createUnixUser(identity);

    // setting wordpress config
    const finalWPConfig = setupInitialWpConfig(
      unixpath.wp.sample,
      host,
      port,
      identity,
      wpDbPassword,
      wpDb,
      cryptoRandomString({ length: 32, type: 'ascii-printable' })
    );
    fs.writeFileSync(unixpath.wp.config, finalWPConfig);

    // setting host php config
    const fpmConfig = setupInitialPHPConfig(
      fs.readFileSync(unixpath.php.www, 'utf8'),
      phpVer,
      identity
    );
    fs.writeFileSync(unixpath.php.host, fpmConfig);

    createPHPErrorLogFile(phpVer, identity);

    // setup nginx
    const virtualHostConfig = getNginxVirtualHostConfig(domain, identity);
    fs.writeFileSync(unixpath.nginx.host, virtualHostConfig);

    // finish directory with permission
    setWpInstalledPathPermission(wpDir, identity);

    const databaseService = new DatabaseService({ host, port, username, password });

    if (wpConfigDbUser !== undefined) {
      await databaseService.dropUser(wpConfigDbUser);
    }

    await databaseService.dropUser(identity);
    await databaseService.createDatabase(wpDb);
    await databaseService.createUserAndGrantPermission(identity, wpDbPassword, wpDb);

    return { phpVer };
  }
}
