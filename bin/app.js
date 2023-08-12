#!/usr/bin/env node

import fs from "fs";
import { Command } from "commander";
import path from "path";
import shell from "shelljs";
import { Sequelize } from "sequelize";
import setupBootstrap from "../bootstraps/setup.bootstrap.js";
import backupBootstrap from "../bootstraps/backup.bootstrap.js";
import templateBootstrap from "../bootstraps/template.bootstrap.js";
import repairBootstrap from "../bootstraps/repair.bootstrap.js";

const program = new Command();

program
  .name('wp-tool')
  .description('CLI to maintenance Wordpress website')
  .version('1.0.0', '-v, --version');

program
  .command('template')
  .action(async function() {
    await templateBootstrap.handler();
  });

program
  .command('build')
  .description('install the webite with themes and plugins into os')
  .requiredOption('-t, --template <template>', 'unix path of the template file')
  .option('-d, --dev', 'run as development mode, setup without alter unix user, nginx, MySQL etc.')
  .option('-h, --host <host>', 'MySQL host')
  .option('-h, --port <port>', 'MySQL port')
  .option('-u, --username <username>', 'MySQL admin username')
  .option('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'root directory for website', '.')
  .action(async function() {
    const { template: templateFilePath, directory, host, port, username, password, dev } = this.opts();
    if (!fs.existsSync(templateFilePath)) {
      throw new Error(`File not exists in ${templateFilePath}.`);
    }
    if (!shell.which('php')) {
      throw new Error('The host need to install php to make it works.');
    }
    if (!dev) {
      if (process.getuid() !== 0) {
        throw new Error('The process needs root permission when production mode.');
      }
      if ((host === undefined || host === 'localhost' || host === '127.0.0.1') && !shell.which('mysqld')) {
        throw new Error('Using localhost or 127.0.0.1 must be installed MySQL database on host.');
      }
    }
    const sequelize = new Sequelize({ host, port, username, password });
    if (!await sequelize.authenticate()) {
      throw new Error('Failed To Connect MySQL Server.');
    }
    await sequelize.close();
    const template = JSON.parse(fs.readFileSync(templateFilePath));
    await setupBootstrap.handler(
      path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory),
      template,
      dev,
      { host, port, user: username, password }
    );
  });

program
  .command('repair')
  .description('repair website (production mode only)')
  .requiredOption('-t, --domain <domain>', 'wordpress website domain')
  .option('-h, --host <host>', 'MySQL host')
  .option('-h, --port <port>', 'MySQL port')
  .option('-u, --username <username>', 'MySQL admin username')
  .option('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'root directory for website', '.')
  .action(async function() {
    const { domain, directory, host, port, username, password } = this.opts();
    if (!shell.which('php')) {
      throw new Error('The host need to install php to make it works.');
    }
    if (process.getuid() !== 0) {
      throw new Error('The process needs root permission when production mode.');
    }
    if ((host === undefined || host === 'localhost' || host === '127.0.0.1') && !shell.which('mysqld')) {
      throw new Error('Using localhost or 127.0.0.1 must be installed MySQL database on host.');
    }
    const sequelize = new Sequelize({ host, port, username, password });
    if (!await sequelize.authenticate()) {
      throw new Error('Failed To Connect MySQL Server.');
    }
    await sequelize.close();
    await repairBootstrap.handler(
      directory,
      domain,
      { host, port, user: username, password }
    );
  });

program
  .command('backup')
  .description('backup database and source code')
  .requiredOption('-u, --username <username>', 'MySQL admin username')
  .requiredOption('-a, --password <password>', 'MySQL admin password')
  .requiredOption('-d, --directory <directory>', 'the root directory of the website to backup')
  .requiredOption('-i, --access-key-id <accessKeyId>', 'AWS s3 bucket access key id')
  .requiredOption('-k, --secret-access-key <secretAccessKey>', 'AWS s3 bucket secret access key')
  .action(async function() {
    const { username, password, directory, accessKeyId, secretAccessKey } = this.opts();
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
      throw new Error("Root directory not exists.");
    }
    if (directory === "/") {
      throw new Error("Cannot archive the root directory.");
    }
    await backupBootstrap.handler(directory, username, password, accessKeyId, secretAccessKey);
  });

program.parseAsync();