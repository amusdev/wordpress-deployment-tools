import mysql from 'mysql2/promise';

export default class DatabaseService {
  options?: mysql.ConnectionOptions;
  constructor(options?: mysql.ConnectionOptions) {
    this.options = options;
  }
  private async createConnection() {
    return await mysql.createConnection(
      this.options || { host: 'localhost', port: 3306, user: 'root', password: '' }
    );
  }
  async isAccessible() {
    try {
      const connection = await this.createConnection();
      connection.destroy();
      return true;
    } catch (e) {
      console.error('Failed To Connect MySQL Server.', { cause: e });
      return false;
    }
  }
  async dropUser(identity: string) {
    const connection = await this.createConnection();
    await connection.execute(`DROP USER IF EXISTS ${identity};`);
    connection.destroy();
  }
  async createDatabase(database: string) {
    const connection = await this.createConnection();
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${database};`);
    connection.destroy();
  }
  async createUserAndGrantPermission(identity: string, password: string, database: string) {
    const connection = await this.createConnection();
    await connection.execute(`
      CREATE USER '${identity}'@'%' IDENTIFIED WITH mysql_native_password BY '${password}';
      GRANT ALL PRIVILEGES ON ${database}.* TO '${identity}'@'%';
      FLUSH PRIVILEGES;`);
    connection.destroy();
  }
}
