import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import tmp from "tmp";
import archiver from "archiver";
import { format } from "date-fns";
import { Engine } from "php-parser";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function parseWpConfigFile(content) {
  const engine = new Engine();
  const { children } = engine.parseCode(content);
  let database = null, dbHost = "localhost", dbPort = 3306;
  for (const child of children) {
    if (child.expression?.what?.name === "define") {
      const [ name, value ] = child.expression.arguments;
      if (name.kind === "string" && name.value === "DB_NAME" && value.kind === "string") {
        database = value.value;
      }
      if (name.kind === "string" && name.value === "DB_HOST" && value.kind === "string") {
        const [ host, port ] = value.value.split(":");
        dbHost = host ?? "localhost";
        if (port !== undefined) {
          dbPort = parseInt(port);
        }
      }
    }
  }
  return { database, dbHost, dbPort };
}

async function backupDatabase(host, port, user, pass, database, fileStream) {
  const mysqldump = spawn('mysqldump', [
    '-h',
    host,
    '-P',
    port,
    '-u',
    user,
    '-p' + pass,
    database
  ]);
  return new Promise(function(resolve, reject) {
    mysqldump.stdout.on('error', reject).pipe(fileStream);

    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

export default {
  handler: async function(rootDir, dbUser, dbPass, s3accessKeyId, s3secretAccessKey) {
    const wpconfig = fs.readFileSync(path.join(rootDir, "wp-config.php"));
    const { database, dbHost, dbPort } = parseWpConfigFile(wpconfig);
    const sqlFile = tmp.fileSync({
      mode: 0o600,
      prefix: 'wp-backup-',
    });
    await backupDatabase(dbHost, dbPort, dbUser, dbPass, database, fs.createWriteStream(sqlFile.name));
    const archiveFile = tmp.fileSync({
      mode: 0o600,
      prefix: 'wp-backup-',
      postfix: '.zip',
    });
    const outputStream = fs.createWriteStream(archiveFile.name);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    outputStream.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    outputStream.on('end', function() {
      console.log('Data has been drained');
    });
    archive.on('error', function(err) {
      throw err;
    });
    archive.pipe(outputStream);

    // archive entire website into archive
    archive.directory(rootDir, 'website');
    archive.file(archiveFile.name, { name: "dump.sql" });

    await archive.finalize();

    const client = new S3Client({
      credentials: {
        accessKeyId: s3accessKeyId,
        secretAccessKey: s3secretAccessKey,
      },
    });

    const name = rootDir.endsWith("/") ? rootDir.split("/").slice(-2)[0] : rootDir.split("/").pop();

    const command = new PutObjectCommand({
      Bucket: "amus-dev-wp-backup",
      Key: `${name}/backup-${format(new Date(), "yyyyMMddHHmmss")}`,
      Body: fs.createReadStream(archiveFile.name),
    });

    await client.send(command);

    console.log("Finished to backup the website.");
  }
}