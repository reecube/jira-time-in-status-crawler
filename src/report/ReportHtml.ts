import { BaseReport } from './BaseReport';

export class ReportHtml extends BaseReport {

  readonly type: string = 'html';

  async run(): Promise<void> {
    throw new Error(`Not implement yet!`); // TODO
  }
}
