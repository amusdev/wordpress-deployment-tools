import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';
import shell from 'shelljs';

import HTTPService from '@/service/http';
import InstallationService from '@/service/installation';
import { MySQLCredential, WPTemplate } from '@/type/common';
import { unzip } from '@/util/zip';

export default {
  handler: async function (
    directory: string,
    template: WPTemplate,
    isDev: boolean,
    database: MySQLCredential
  ) {
    const distDir = `${directory}/${template.domain}`;

    console.log('Downloading Wordpress core files...');
    const tmpfile = await HTTPService.downloadWpBundleFile(template.version);
    await unzip(tmpfile, directory);
    fs.renameSync(`${directory}/wordpress`, distDir);

    const themeDir = path.join(distDir, 'wp-content/themes');
    for (const id in template.themes) {
      console.log(`Downloading theme ${id} files...`);
      const theme = await HTTPService.downloadWpThemeBundleFile(id, template.themes[id]);
      const distPath = path.join(themeDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await unzip(theme, themeDir);
    }

    const pluginDir = path.join(distDir, 'wp-content/plugins');
    for (const id in template.plugins) {
      console.log(`Downloading plugin ${id} files...`);
      const plugin = await HTTPService.downloadWpPluginBundleFile(id, template.plugins[id]);
      const distPath = path.join(pluginDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await unzip(plugin, pluginDir);
    }

    console.log('Finished to download all files');

    if (isDev) {
      // is development mode then skip to modify the os and database
      return;
    }

    const { phpVer } = await InstallationService.setup(
      distDir,
      template.domain,
      template.domain.replaceAll(/\.|-/g, '_'),
      database
    );

    if (shell.exec(`systemctl restart nginx`).code !== 0) {
      throw new Error('Failed to restart php service');
    }

    if (shell.exec(`systemctl restart php${phpVer}-fpm`).code !== 0) {
      throw new Error('Failed to restart php service');
    }
  },
};
