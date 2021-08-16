import { BaseAction } from './BaseAction';

import { BaseReport } from '../report/BaseReport';
import { ReportCsv } from '../report/ReportCsv';
import { ReportHtml } from '../report/ReportHtml';
import { ReportImage } from '../report/ReportImage';

export class Report extends BaseAction {

  readonly type: string = 'report';

  async run(): Promise<void> {
    const generators: BaseReport[] = [
      new ReportCsv(this.context, this.args),
      new ReportHtml(this.context, this.args),
      new ReportImage(this.context, this.args),
    ];

    const type = this.args[0]?.toLowerCase();

    if (!type) throw new Error(`Empty report type not supported!`);

    for (const generator of generators) {
      if (generator.type === type) return await generator.run();
    }

    throw new Error(`Unknown report type '${type}'!`);
  }
}
