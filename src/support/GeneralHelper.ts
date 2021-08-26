import * as _ from 'lodash';

import { Dictionary } from './Types';
import { IssueReference } from '../model/Issue';

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

  static stripInvalidChars(input: string): string {
    // Source: https://stackoverflow.com/a/20864946/3359418
    return input.replace(/[^a-zA-Z0-9_\-]+/g, '');
  }

  static addToCollection(ref: IssueReference | IssueReference[], collection: Dictionary<string>) {
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

  static recursiveMerge(a: any, b: any): any {
    if (typeof a === 'undefined') return b;

    if (typeof b === 'undefined') return a;

    if (typeof b !== 'object' || typeof a !== 'object') return b;

    if (Array.isArray(a) && Array.isArray(b)) return [
      ...a,
      ...b,
    ];

    const result: Dictionary<any> = {
      ...a,
      ...b,
    };

    for (const key of Object.keys(result)) {
      result[key] = this.recursiveMerge(a[key], b[key]);
    }

    return result;
  }

  static listOf<Type>(length: number, initial: Type = undefined): Type[] {
    return new Array(length).fill(initial);
  }

  static groupByList<Type>(
    list: Type[],
    makeList: (Type) => string[],
  ): Dictionary<Type[]> {
    const newList: { key: string, value: Type }[] = _.flatten(list.map(entry => {
      return makeList(entry).map(key => {
        return {
          key,
          value: entry,
        };
      });
    }));

    const grouped = _.groupBy(newList, entry => {
      return entry.key;
    });

    return _.mapValues(grouped, entries => entries.map(it => it.value));
  }
}
