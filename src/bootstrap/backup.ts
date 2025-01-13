import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { format } from 'date-fns';
import fs from 'fs';
import tmp from 'tmp';

import { getWpConfigByPath } from '@/util/config';
import { backup } from '@/util/database';
import { zipFiles } from '@/util/zip';

export default class BackupBootstrap {
  static async handler(
    rootDir: string,
    dbUser: string,
    dbPass: string,
    s3accessKeyId: string,
    s3secretAccessKey: string
  ) {
    const { database, dbHost, dbPort } = getWpConfigByPath(rootDir);
    const sqlFile = tmp.fileSync({
      mode: 0o600,
      prefix: 'wp-backup-',
      postfix: '.sql',
    });
    if (database === undefined) {
      throw new Error("wp-config.php don't contains DB_NAME parameter.");
    }
    await backup(fs.createWriteStream(sqlFile.name), dbHost, dbPort, dbUser, dbPass, database);

    const archiveFile = tmp.fileSync({
      mode: 0o600,
      prefix: 'wp-backup-',
      postfix: '.zip',
    });
    await zipFiles(fs.createWriteStream(archiveFile.name), rootDir, archiveFile.name);

    const client = new S3Client({
      credentials: {
        accessKeyId: s3accessKeyId,
        secretAccessKey: s3secretAccessKey,
      },
    });

    const name = rootDir.endsWith('/') ? rootDir.split('/').slice(-2)[0] : rootDir.split('/').pop();

    const command = new PutObjectCommand({
      Bucket: 'amus-dev-wp-backup',
      Key: `${name}/backup-${format(new Date(), 'yyyyMMddHHmmss')}`,
      Body: fs.createReadStream(archiveFile.name),
    });

    await client.send(command);

    console.log('Finished to backup the website.');
  }
}
