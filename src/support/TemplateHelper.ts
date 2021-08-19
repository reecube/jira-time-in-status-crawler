import * as fs from 'fs';

import { Dictionary } from './Types';

const PATH = './src/templates';

export abstract class TemplateHelper {
  private static convertToString(input: any): string {
    if (typeof input === 'string') return input;

    return JSON.stringify(input);
  }

  static load(name: string, context: Dictionary<any>): string {
    const path = `${PATH}/${name}.html`;

    let html = fs.readFileSync(path).toString();

    for (const [key, value] of Object.entries<string>(context)) {
      const regex = new RegExp(`\{\{\s*${key}\s*\}\}`, 'g');

      const replacement = TemplateHelper.convertToString(value);

      html = html.replace(regex, replacement);
    }

    return html;
  }
}
