#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

import BackupBootstrap from '@/bootstrap/backup.js';
import RepairBootstrap from '@/bootstrap/repair.js';
import SetupBootstrap from '@/bootstrap/setup.js';
import TemplateBootstrap from '@/bootstrap/template.js';
import DatabaseService from '@/service/database';
import { isDirectory, isFile } from '@/util/path';
import { isMySQLInstalled, isPHPInstalled } from '@/util/unix';

const program = new Command();

program
  .name('wp-tool')
  .description('CLI to maintenance Wordpress website')
  .version('1.0.0', '-v, --version');

program.command('template').action(async function () {
  await TemplateBootstrap.handler();
});

program
  .command('build')
  .description('install the webite with themes and plugins into os')
  .requiredOption('-t, --template <template>', 'unix path of the template file')
  .option('--dev', 'run as development mode, setup without alter unix user, nginx, MySQL etc.')
  .option('-h, --host <host>', 'MySQL host')
  .option('-p, --port <port>', 'MySQL port')
  .option('-u, --username <username>', 'MySQL admin username')
  .option('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'root directory for website', '.')
  .action(async (options) => {
    const { template: templateFilePath, directory, host, port, username, password, dev } = options;
    if (!isFile(templateFilePath)) {
      throw new Error('Please provide the correct file path.');
    }
    if (!isPHPInstalled()) {
      throw new Error('The host need to install php to make it works.');
    }
    if (!dev) {
      if (process.getuid && process.getuid() !== 0) {
        throw new Error('The process needs root permission when production mode.');
      }
      if (
        (host === undefined || host === 'localhost' || host === '127.0.0.1') &&
        !isMySQLInstalled()
      ) {
        throw new Error('Using localhost or 127.0.0.1 must be installed MySQL database on host.');
      }
    }
    const accessible = await new DatabaseService({
      host,
      port,
      user: username,
      password,
    }).isAccessible();
    if (accessible) {
      return;
    }
    const template = JSON.parse(fs.readFileSync(templateFilePath, 'utf8'));
    await SetupBootstrap.handler(
      path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory),
      template,
      dev,
      { host, port, username, password }
    );
  });

program
  .command('repair')
  .description('repair website (production mode only)')
  .requiredOption('-t, --domain <domain>', 'wordpress website domain')
  .option('-h, --host <host>', 'MySQL host')
  .option('-p, --port <port>', 'MySQL port')
  .option('-u, --username <username>', 'MySQL admin username')
  .option('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'root directory for website', '.')
  .action(async (options) => {
    const { domain, directory, host, port, username, password } = options;
    if (!isPHPInstalled()) {
      throw new Error('The host need to install php to make it works.');
    }
    if (process.getuid && process.getuid() !== 0) {
      throw new Error('The process needs root permission when production mode.');
    }
    if (
      (host === undefined || host === 'localhost' || host === '127.0.0.1') &&
      !isMySQLInstalled()
    ) {
      throw new Error('Using localhost or 127.0.0.1 must be installed MySQL database on host.');
    }
    const accessible = await new DatabaseService({
      host,
      port,
      user: username,
      password,
    }).isAccessible();
    if (accessible) {
      return;
    }
    await RepairBootstrap.handler(directory, domain, { host, port, username, password });
  });

program
  .command('backup')
  .description('backup database and source code')
  .requiredOption('-u, --username <username>', 'MySQL admin username')
  .requiredOption('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'the root directory of the website to backup')
  .requiredOption('-i, --access-key-id <accessKeyId>', 'AWS s3 bucket access key id')
  .requiredOption('-k, --secret-access-key <secretAccessKey>', 'AWS s3 bucket secret access key')
  .action(async (options) => {
    const { username, password, directory, accessKeyId, secretAccessKey } = options;
    if (!isDirectory(directory)) {
      throw new Error('Root directory not exists.');
    }
    if (directory === '/') {
      throw new Error('Cannot archive the root directory.');
    }
    await BackupBootstrap.handler(directory, username, password, accessKeyId, secretAccessKey);
  });

program.parseAsync();
