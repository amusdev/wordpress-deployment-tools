export function getWpBundleURL(version: string) {
  if (version === 'latest') {
    return `https://wordpress.org/${version}.zip`;
  }
  return `https://wordpress.org/wordpress-${version}.zip`;
}

export function getWpThemeBundleURL(id: string, version = 'latest') {
  if (version === 'latest') {
    return `https://downloads.wordpress.org/theme/${id}.zip`;
  }
  return `https://downloads.wordpress.org/theme/${id}.${version}.zip`;
}

export function getWpPluginBundleURL(id: string, version = 'latest') {
  if (version === 'latest') {
    return `https://downloads.wordpress.org/plugin/${id}.zip`;
  }
  return `https://downloads.wordpress.org/plugin/${id}.${version}.zip`;
}
