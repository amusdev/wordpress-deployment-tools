export interface MySQLCredential {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface WPTemplate {
  domain: string,
  version: string,
  themes: { [id: string]: string },
  plugins: { [id: string]: string },
}