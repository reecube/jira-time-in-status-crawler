import { BaseReport } from './BaseReport';

export class ReportImage extends BaseReport {

  readonly type: string = 'image';

  async run(): Promise<void> {
    throw new Error(`Not implement yet!`); // TODO
  }
}
