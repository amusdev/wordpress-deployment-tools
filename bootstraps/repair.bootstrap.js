import installService from "../services/install.service.js";

export default {
  handler: async function (directory, domain, database) {
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