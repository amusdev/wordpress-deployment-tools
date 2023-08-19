import fs from 'node:fs';
import path from 'node:path';
import shell from 'shelljs';
import inquirer from 'inquirer';
import { Sequelize, QueryTypes } from 'sequelize';
import wpHelper from '@/helpers/wp.helper.js';
import mathHelper from '@/helpers/math.helper';
import { MySQLCredential } from '@/types/common.js';

async function configSetup(wpDir: string, domain: string, nickname: string, database: MySQLCredential) {
  console.log('Setup OS and MySQL database');

  let { host, port, username, password } = database;
  let wpConfigDbUser = undefined;
  let wpDb = nickname;
  let wpDbPassword = mathHelper.random(20, { symbol: true });

  // check php version for default
  const matches = shell.exec('php -v').stdout.match(/^PHP ([0-9]\.[0-9])/);
  if (matches === null) {
    throw new Error('Cannot find php version using `php -v`');
  }
  const [ php ] = matches;
  const fpm = `/etc/php/${php}/fpm`;
  if (!fs.existsSync(fpm) || !fs.lstatSync(fpm).isDirectory()) {
    throw new Error(`PHP fpm path is not a directory at ${fpm}`);
  }

  const wpConfig = path.join(wpDir, 'wp-config.php');
  if (fs.existsSync(wpConfig)) {
    const parsedWpConfig = wpHelper.parseWpConfig(fs.readFileSync(wpConfig, 'utf8'));
    if (host !== parsedWpConfig.dbHost) {
      const result = await inquirer.prompt({
        type: 'confirm',
        name: 'continueProgress',
        message: `Original ${wpConfig} DB_HOST is not same with current database configuration, continue?`,
        default: false,
      });
      if (!result.continueProgress) {
        process.exit(1);
      }
    }
    wpDb = parsedWpConfig.database || nickname;
    wpConfigDbUser = parsedWpConfig.dbUser;
  }
  shell.cp(path.join(wpDir, 'wp-config-sample.php'), wpConfig);

  // setup user for php runtime
  if (shell.grep(nickname, '/etc/passwd').code !== 0) {
    if (shell.exec(`adduser --system --no-create-home --group --disabled-login ${nickname}`).code !== 0) {
      throw new Error(`Failed to create the user named ${nickname}`);
    }
  }

  // setting wordpress config
  shell.sed('-i', 'put your unique phrase here', mathHelper.random(32, { symbol: true }), wpConfig);
  shell.sed('-i', 'database_name_here', wpDb, wpConfig);
  shell.sed('-i', 'username_here', nickname, wpConfig);
  shell.sed('-i', 'password_here', wpDbPassword, wpConfig);
  shell.sed('-i', 'localhost', port === 3306 ? host : `${host}:${port}`, wpConfig);

  const phpConfig = path.join(fpm, `pool.d/${domain}.conf`);
  shell.cp(path.join(fpm, 'pool.d/www.conf'), phpConfig);

  // setting host php config
  shell.sed('-i', '[www]', `[${nickname}]`, phpConfig);
  shell.sed('-i', 'user = www-data', `user = ${nickname}`, phpConfig);
  shell.sed('-i', 'group = www-data', `group = ${nickname}`, phpConfig);
  shell.sed('-i', `listen = /run/php/php${php}-fpm.sock`, `listen = /run/php/php${php}-fpm-$pool.sock`, phpConfig);
  shell.sed('-i', `;slowlog = log/$pool.log.slow`, `slowlog = /var/log/php${php}-fpm-$pool.log.slow`, phpConfig);
  shell.sed('-i', `;php_admin_value[error_log] = /var/log/fpm-php.www.log`, `php_admin_value[error_log] = /var/log/php${php}-fpm-$pool.log.error`, phpConfig);
  shell.sed('-i', ';php_admin_flag[log_errors] = on', 'php_admin_flag[log_errors] = on');

  shell.touch(`/var/log/php${php}-fpm-${nickname}.log.error`);
  shell.exec(`chown ${nickname}:${nickname} /var/log/php${php}-fpm-${nickname}.log.error`);

  // setup nginx
  const nginxTemplate = fs.readFileSync('../templates/nginx.conf', 'utf8');
  const nginxConfig = path.join('/etc/nginx/sites-available', domain);
  fs.writeFileSync(nginxConfig, nginxTemplate.replace(/{{host}}/g, domain).replace(/{{alt_host}}/g, nickname));

  // finish directory with permission
  shell.exec(`chown ${nickname}:${nickname} -R ${wpDir}`);
  shell.exec(`find ${wpDir} -type d -exec chmod 755 {} \;`);
  shell.exec(`find ${wpDir} -type f -exec chmod 644 {} \;`);

  const sequelize = new Sequelize({ host, port, username, password });

  if (wpConfigDbUser !== undefined) {
    await sequelize.query(`DROP USER IF EXISTS ${wpConfigDbUser};`, { type: QueryTypes.RAW });
  }

  await sequelize.query(`
    CREATE DATABASE IF NOT EXISTS ${wpDb};
    DROP USER IF EXISTS '${nickname}'@'%';
    CREATE USER '${nickname}'@'%' IDENTIFIED WITH mysql_native_password BY '${wpDbPassword}';
    GRANT ALL PRIVILEGES ON ${wpDb}.* TO '${nickname}'@'%';
    FLUSH PRIVILEGES;
  `);

  return { php };
}

export default {
  configSetup,
}