import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';
import shell from 'shelljs';
import downloadService from '@/services/download.service.js';
import extractService from '@/services/extract.service.js';
import installService from '@/services/install.service.js';
import { MySQLCredential, WPTemplate } from '@/types/common';

function getWpCoreUrl(code: string) {
  if (code === 'latest') {
    return `https://wordpress.org/${code}.zip`;
  }
  return `https://wordpress.org/wordpress-${code}.zip`;
}

function getWpThemeUrl(id: string, version = 'latest') {
  if (version === 'latest') {
    return `https://downloads.wordpress.org/theme/${id}.zip`;
  }
  return `https://downloads.wordpress.org/theme/${id}.${version}.zip`;
}

function getWpPluginUrl(id: string, version = 'latest') {
  if (version === 'latest') {
    return `https://downloads.wordpress.org/plugin/${id}.zip`;
  }
  return `https://downloads.wordpress.org/plugin/${id}.${version}.zip`;
}

export default {
  handler: async function (directory: string, template: WPTemplate, isDev: boolean, database: MySQLCredential) {
    const distDir = `${directory}/${template.domain}`;
    
    console.log('Downloading Wordpress core files...');
    const tmpfile = await downloadService.download(getWpCoreUrl(template.version));
    await extractService.zip(tmpfile, directory);
    fs.renameSync(`${directory}/wordpress`, distDir);

    const themeDir = path.join(distDir, 'wp-content/themes');
    for (const id in template.themes) {
      console.log(`Downloading theme ${id} files...`);
      const theme = await downloadService.download(getWpThemeUrl(id, template.themes[id]));
      const distPath = path.join(themeDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await extractService.zip(theme, themeDir);
    }

    const pluginDir = path.join(distDir, 'wp-content/plugins');
    for (const id in template.plugins) {
      console.log(`Downloading plugin ${id} files...`);
      const plugin = await downloadService.download(getWpPluginUrl(id, template.plugins[id]));
      const distPath = path.join(pluginDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await extractService.zip(plugin, pluginDir);
    }

    console.log('Finished to download all files');

    if (isDev) {
      // is development mode then skip to modify the os and database
      return;
    }

    const { php } = await installService.configSetup(
      distDir,
      template.domain,
      template.domain.replaceAll(/\.|-/g, '_'),
      database
    );

    if (shell.exec(`systemctl restart nginx`).code !== 0) {
      throw new Error('Failed to restart php service');
    }

    if (shell.exec(`systemctl restart php${php}-fpm`).code !== 0) {
      throw new Error('Failed to restart php service');
    }
  }
}