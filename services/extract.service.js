import extract from "extract-zip";

export default {
  zip: async function (source, dist) {
    try {
      await extract(source, { dir: dist });
    } catch (err) {
      throw new Error(`Failed to extract zip on ${source}`, { cause: err });
    }
  }
}