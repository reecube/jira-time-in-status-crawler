import { Dictionary } from './Types';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export abstract class GeneralHelper {
  static makeId(length: number = 32): string {
    // Inspired by: https://stackoverflow.com/a/1349426/3359418

    const result = [];

    for (let i = 0; i < length; i++) {
      const char = CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));

      result.push(char);
    }

    return result.join('');
  }

  static addToCollection(ref: any, collection: Dictionary<string>) {
    if (!ref) return;

    if (!Array.isArray(ref)) {
      collection[ref.id] = ref.name;

      return;
    }

    for (const entry of ref) {
      this.addToCollection(entry, collection);
    }
  }

  static getReferenceByPath(path: string | string[], input: Dictionary<any>): Dictionary<any> {
    if (typeof path === 'string') path = path.split('.');

    const key = path.shift();

    if (typeof key !== 'string') return input;

    if (typeof input[key] !== 'object') input[key] = {};

    return this.getReferenceByPath(path, input[key]);
  }
}
