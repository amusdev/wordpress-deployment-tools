import archiver from 'archiver';
import extract from 'extract-zip';
import fs from 'fs';

export async function zipFiles(fileStream: fs.WriteStream, sourceDir: string, sqlFile: string) {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  fileStream.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });
  fileStream.on('end', function () {
    console.log('Data has been drained');
  });
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(fileStream);

  // archive entire website into archive
  archive.directory(sourceDir, 'website');
  archive.file(sqlFile, { name: 'dump.sql' });

  await archive.finalize();
}

export async function unzip(source: string, dist: string) {
  try {
    await extract(source, { dir: dist });
  } catch (err) {
    throw new Error(`Failed to extract zip on ${source}`, { cause: err });
  }
}
