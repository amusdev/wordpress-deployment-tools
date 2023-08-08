#!/usr/bin/env node

import fs from "fs";
import { Command } from "commander";
import path from "path";
import setupBootstrap from "../bootstraps/setup.bootstrap.js";
import backupBootstrap from "../bootstraps/backup.bootstrap.js";
import templateBootstrap from "../bootstraps/template.bootstrap.js";

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
  .description('build the website and install themes and plugins')
  .requiredOption('-t, --template <template>', 'template file on unix system path')
  .option('-d, --directory <directory>', 'root directory for website', '.')
  .action(async function() {
    const { template: templateFilePath, directory } = this.opts();
    if (!fs.existsSync(templateFilePath)) {
      throw new Error(`File not exists in ${templateFilePath}.`);
    }
    const template = JSON.parse(fs.readFileSync(templateFilePath));
    await setupBootstrap.handler(
      path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory),
      template
    );
  });

program
  .command('backup')
  .description('backup the website')
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