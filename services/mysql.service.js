import mysql from "mysql2";

export default class MySQLService {
  dbHost = "localhost";
  dbPort = 3306;
  dbUser;
  dbPassword;
  constructor(host, port, user, password) {
    this.dbHost = host;
    this.dbPort = port;
    this.dbUser = user;
    this.dbPassword = password;
  };
  #createConnection() {
    return mysql.createConnection({
      host: this.dbHost,
      port: this.dbPort,
      user: this.dbUser,
      password: this.dbPassword,
    });
  }
  testConnection() {
    return new Promise((resolve) => {
      const conn = this.#createConnection();
      conn.connect((err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
        conn.destroy();
      });
    });
  }
  async setupWp(wpUser, wpPassword, wpDb) {
    const conn = this.#createConnection();
    return new Promise((resolve, reject) => {
      conn.query(`
        CREATE DATABASE IF NOT EXISTS ${wpDb};
        DROP USER IF EXISTS '${wpUser}'@'%';
        CREATE USER '${wpUser}'@'%' IDENTIFIED WITH mysql_native_password BY '${wpPassword}';
        GRANT ALL PRIVILEGES ON ${wpDb}.* TO '${wpUser}'@'%';
        FLUSH PRIVILEGES;
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
        conn.destroy();
      });
    })
  }
}