import { Context } from '../Context';

export abstract class BaseReport {
  abstract readonly type: string;

  protected readonly context: Context;
  protected readonly args: string[];

  constructor(context: Context, args: string[]) {
    this.context = context;
    this.args = args;
  }

  abstract run(): Promise<void>
}
