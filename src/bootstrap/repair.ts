import InstallationService from '@/service/installation';
import { MySQLCredential } from '@/type/common';
import { restartNginxService, restartPHPFPMService } from '@/util/unix';

export default class RepairBootstrap {
  static async handler(directory: string, domain: string, database: MySQLCredential) {
    const { phpVer } = await InstallationService.setup(
      directory,
      domain,
      domain.replaceAll(/\.|-/g, '_'),
      database
    );

    restartNginxService();
    restartPHPFPMService(phpVer);
  }
}
