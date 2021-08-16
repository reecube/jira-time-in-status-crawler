const EXTENSION_SEPARATOR = '.';

export abstract class PathHelper {
  static getExtension(path: string, defaultValue: string = ''): string {
    const lastIdx = path.lastIndexOf(EXTENSION_SEPARATOR);

    if (lastIdx < 0) return defaultValue;

    return path.substr(lastIdx + EXTENSION_SEPARATOR.length);
  }

  static getBasename(path: string): string {
    const lastIdx = path.lastIndexOf(EXTENSION_SEPARATOR);

    if (lastIdx < 0) return path;

    return path.substr(0, lastIdx);
  }
}
