import { Options, QueryTypes, Sequelize } from 'sequelize';

export default class DatabaseService {
  sequelize: Sequelize;
  constructor(options?: Options) {
    this.sequelize = new Sequelize(options);
  }
  async isAccessible() {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (e) {
      console.error('Failed To Connect MySQL Server.', { cause: e });
      return false;
    } finally {
      await this.sequelize.close();
    }
  }
  async dropUser(identity: string) {
    await this.sequelize.query(`DROP USER IF EXISTS ${identity};`, { type: QueryTypes.RAW });
  }
  async createDatabase(database: string) {
    await this.sequelize.query(`CREATE DATABASE IF NOT EXISTS ${database};`);
  }
  async createUserAndGrantPermission(identity: string, password: string, database: string) {
    await this.sequelize.query(`
      CREATE USER '${identity}'@'%' IDENTIFIED WITH mysql_native_password BY '${password}';
      GRANT ALL PRIVILEGES ON ${database}.* TO '${identity}'@'%';
      FLUSH PRIVILEGES;`);
  }
}
