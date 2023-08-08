import fs from "fs";
import path from "path";
import { rimrafSync } from "rimraf";
import downloadService from "../services/download.service.js";
import extractService from "../services/extract.service.js";

function getWpCoreUrl(code) {
  if (code === "latest") {
    return `https://wordpress.org/${code}.zip`;
  }
  return `https://wordpress.org/wordpress-${code}.zip`;
}

function getWpThemeUrl(id, version = "latest") {
  if (version === "latest") {
    return `https://downloads.wordpress.org/theme/${id}.zip`;
  }
  return `https://downloads.wordpress.org/theme/${id}.${version}.zip`;
}

function getWpPluginUrl(id, version = "latest") {
  if (version === "latest") {
    return `https://downloads.wordpress.org/plugin/${id}.zip`;
  }
  return `https://downloads.wordpress.org/plugin/${id}.${version}.zip`;
}

export default {
  handler: async function (directory, template) {
    console.log("Downloading Wordpress core files...");
    const tmpfile = await downloadService.download(getWpCoreUrl(template.version));
    await extractService.zip(tmpfile, directory);
    fs.renameSync(`${directory}/wordpress`, `${directory}/${template.name}`);

    const themeDir = `${directory}/${template.name}/wp-content/themes`;
    for (const id in template.themes) {
      console.log(`Downloading theme ${id} files...`);
      const theme = await downloadService.download(getWpThemeUrl(id, template.themes[id]));
      const distPath = path.join(themeDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await extractService.zip(theme, themeDir);
    }

    const pluginDir = `${directory}/${template.name}/wp-content/plugins`;
    for (const id in template.plugins) {
      console.log(`Downloading plugin ${id} files...`);
      const plugin = await downloadService.download(getWpPluginUrl(id, template.plugins[id]));
      const distPath = path.join(pluginDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await extractService.zip(plugin, pluginDir);
    }

    console.log("Finished to download all files");
  }
}