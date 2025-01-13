import { spawn } from 'child_process';
import fs from 'fs';

export async function backup(
  fileStream: fs.WriteStream,
  host: string,
  port: number,
  user: string,
  pass: string,
  database: string
) {
  const mysqldump = spawn('mysqldump', [
    '-h',
    host,
    '-P',
    port.toString(),
    '-u',
    user,
    '-p' + pass,
    '--protocol=tcp',
    '--column-statistics=FALSE',
    '--routines',
    '--events',
    '--single-transaction',
    // https://stackoverflow.com/questions/75183032/mysqldump-for-aws-rds-flush-tables-error-on-linux-only
    '--set-gtid-purged=OFF',
    database,
  ]);
  return new Promise(function (resolve, reject) {
    mysqldump.stdout.on('error', reject).pipe(fileStream);

    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}
