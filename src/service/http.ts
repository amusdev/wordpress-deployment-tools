import axios from 'axios';
import fs from 'fs';
import tmp from 'tmp';

import { getWpBundleURL, getWpPluginBundleURL, getWpThemeBundleURL } from '@/util/url';

export default class HTTPService {
  static async downloadFile(url: string) {
    const file = tmp.fileSync({
      mode: 0o644,
      prefix: 'wp-setup-',
    });

    const response = await axios.get(url, { responseType: 'stream' });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Download file return unexcepted code (${response.status})`);
    }

    const fileStream = fs.createWriteStream(file.name);

    return new Promise<string>((resolve, reject) => {
      response.data.pipe(fileStream);
      let error: Error | null = null;
      fileStream.on('error', (err) => {
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
  static async downloadWpBundleFile(version: string) {
    return this.downloadFile(getWpBundleURL(version));
  }
  static async downloadWpThemeBundleFile(id: string, version: string) {
    return this.downloadFile(getWpThemeBundleURL(id, version));
  }
  static async downloadWpPluginBundleFile(id: string, version: string) {
    return this.downloadFile(getWpPluginBundleURL(id, version));
  }
}
