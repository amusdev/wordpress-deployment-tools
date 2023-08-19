import shell from 'shelljs';
import installService from "@/services/install.service.js";
import { MySQLCredential } from "@/types/common";

export default {
  handler: async function (directory: string, domain: string, database: MySQLCredential) {
    const { php } = await installService.configSetup(
      directory,
      domain,
      domain.replaceAll(/\.|-/g, "_"),
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