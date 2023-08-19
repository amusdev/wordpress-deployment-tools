import fs from "fs";
import axios from "axios";
import tmp from "tmp";

export default {
  download: async function (url: string) {
    const file = tmp.fileSync({
      mode: 0o644,
      prefix: 'wp-setup-',
    });

    const response = await axios.get(url, { responseType: "stream" });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Download file return unexcepted code (${response.status})`);
    }

    const fileStream = fs.createWriteStream(file.name);

    return new Promise<string>((resolve, reject) => {
      response.data.pipe(fileStream);
      let error: Error | null = null;
      fileStream.on('error', err => {
        error = err;
        fileStream.close();
        reject(err);
      });
      fileStream.on('close', () => {
        if (!error) {
          resolve(file.name);
        }
      });
    });
  }
}