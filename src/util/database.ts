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
    database,
  ]);
  return new Promise(function (resolve, reject) {
    mysqldump.stdout.on('error', reject).pipe(fileStream);

    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}
