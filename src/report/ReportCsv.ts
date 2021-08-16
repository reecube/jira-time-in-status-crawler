import * as fs from 'fs';

import { BaseReport } from './BaseReport';

const CSV_SEPARATOR_COL = ';';
const CSV_SEPARATOR_ROW = '\n';

const REPORT_FILE_DEFAULT = 'default.csv';

export class ReportCsv extends BaseReport {

  readonly type: string = 'csv';

  async run(): Promise<void> {
    const localIssues = Object.values(this.context.readAllOutputIssues());

    const issueTable = this.context.mapIssueTable(localIssues);

    const rowFields = Object.keys(issueTable[0]);

    const csv = issueTable.map(entry => {
      const row = [];

      for (const rowField of rowFields) {
        row.push(entry[rowField]);
      }

      return row.join(CSV_SEPARATOR_COL);
    }).join(CSV_SEPARATOR_ROW);

    const path = this.context.prepareReportPath(this.type, REPORT_FILE_DEFAULT);

    fs.writeFileSync(path, csv);
  }
}
