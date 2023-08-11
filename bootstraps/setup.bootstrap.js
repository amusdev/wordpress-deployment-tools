import fs from "fs";
import path from "path";
import { rimrafSync } from "rimraf";
import shell from "shelljs";
import downloadService from "../services/download.service.js";
import extractService from "../services/extract.service.js";

function random(length, { lower = true, upper = true, numeric = true, symbol = false } = {}) {
  let mask = '';
  if (lower) mask += 'abcdefghijklmnopqrstuvwxyz';
  if (upper) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numeric) mask += '0123456789';
  if (symbol) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
  let result = '';
  for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

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
  /**
   * 
   * @param {string} directory 
   * @param {Object} template 
   * @param {boolean} isDev 
   * @param {import('../services/mysql.service.js').default} mysqlService 
   */
  handler: async function (directory, template, isDev, mysqlService) {
    const distDir = `${directory}/${template.domain}`;
    const escapeDomain = template.domain.replaceAll(/\.|-/g, "_");
    
    console.log("Downloading Wordpress core files...");
    const tmpfile = await downloadService.download(getWpCoreUrl(template.version));
    await extractService.zip(tmpfile, directory);
    fs.renameSync(`${directory}/wordpress`, distDir);

    const themeDir = path.join(distDir, "wp-content/themes");
    for (const id in template.themes) {
      console.log(`Downloading theme ${id} files...`);
      const theme = await downloadService.download(getWpThemeUrl(id, template.themes[id]));
      const distPath = path.join(themeDir, id);
      if (fs.existsSync(distPath)) {
        rimrafSync(distPath);
      }
      await extractService.zip(theme, themeDir);
    }

    const pluginDir = path.join(distDir, "wp-content/plugins");
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

    if (isDev) {
      // is development mode then skip to modify the os and database
      return;
    }

    console.log("Setup OS and MySQL database");

    const [ phpVer ] = shell.exec("php --ini").stdout.match(/([0-9]\.[0-9])/);
    const fpm = `/etc/php/${phpVer}/fpm`;
    if (!fs.lstatSync(fpm).isDirectory()) {
      throw new Error(`PHP fpm path is not a directory at ${fpm}`);
    }

    // setup user for php-fpm
    if (shell.grep(escapeDomain, "/etc/passwd").code !== 0) {
      if (shell.exec(`adduser --system --no-create-home --group --disabled-login ${escapeDomain}`).code !== 0) {
        throw new Error(`Failed to create the user named ${escapeDomain}`);
      }
    }

    const wpConfigPath = path.join(distDir, "wp-config.php");

    shell.cp(path.join(distDir, "wp-config-sample.php"), wpConfigPath);

    const phpPoolConf = path.join(fpm, `pool.d/${template.domain}.conf`);
    const wpDbPassword = random(20, { symbol: true });

    // setting host php config
    shell.cp(path.join(fpm, "pool.d/www.conf"), phpPoolConf);

    shell.sed("-i", "[www]", `[${escapeDomain}]`, phpPoolConf);
    shell.sed("-i", "user = www-data", `user = ${escapeDomain}`, phpPoolConf);
    shell.sed("-i", "group = www-data", `group = ${escapeDomain}`, phpPoolConf);
    shell.sed("-i", `listen = /run/php/php${phpVer}-fpm.sock`, `listen = /run/php/php${phpVer}-fpm-$pool.sock`, phpPoolConf);
    shell.sed("-i", `;slowlog = log/$pool.log.slow`, `slowlog = /var/log/php${phpVer}-fpm-$pool.log.slow`, phpPoolConf);
    shell.sed("-i", `;php_admin_value[error_log] = /var/log/fpm-php.www.log`, `php_admin_value[error_log] = /var/log/php${phpVer}-fpm-$pool.log.error`, phpPoolConf);
    shell.sed("-i", ";php_admin_flag[log_errors] = on", "php_admin_flag[log_errors] = on");

    shell.touch(`/var/log/php${phpVer}-fpm-${escapeDomain}.log.error`);
    shell.exec(`chown ${escapeDomain}:${escapeDomain} /var/log/php${phpVer}-fpm-${escapeDomain}.log.error`);

    if (shell.exec(`service php${phpVer}-fpm restart`).code !== 0) {
      throw new Error("Failed to restart php service");
    }

    // setting nginx config
    const virtualHost = fs.readFileSync("../templates/nginx.conf", "utf8")
      .replace(/{{host}}/g, template.domain)
      .replace(/{{alt_host}}/g, escapeDomain);
    fs.writeFileSync(path.join("/etc/nginx/sites-available", template.domain), virtualHost);

    // setting wordpress config
    shell.sed("-i", "put your unique phrase here", random(32, { symbol: true }), wpConfigPath);
    shell.sed("-i", "database_name_here", escapeDomain, wpConfigPath);
    shell.sed("-i", "username_here", escapeDomain, wpConfigPath);
    shell.sed("-i", "password_here", wpDbPassword, wpConfigPath);
    shell.sed("-i", "localhost", `${mysqlService.host}:${mysqlService.port}`, wpConfigPath);

    shell.exec(`chown ${escapeDomain}:${escapeDomain} -R ${distDir}`);
    shell.exec(`find ${distDir} -type d -exec chmod 755 {} \;`);
    shell.exec(`find ${distDir} -type f -exec chmod 644 {} \;`);
    
    await mysqlService.setupWp(escapeDomain, wpDbPassword, escapeDomain);
  }
}