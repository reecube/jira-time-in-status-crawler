import * as fs from 'fs';

import { BaseReport } from './BaseReport';
import { TemplateHelper } from '../support/TemplateHelper';

export class ReportChart extends BaseReport {

  readonly type: string = 'chart';

  async run(): Promise<void> {
    const localIssues = Object.values(this.context.readAllOutputIssues());

    const issueTable = this.context.mapIssueTable(localIssues);

    for (const chartSite of this.context.project.chartSites) {
      const chartHtmls = [];

      for (const chart of chartSite.charts) {
        const chartConfig = chart.buildConfig(issueTable);

        const chartHtml = TemplateHelper.load('chart', {
          id: chart.id,
          config: chartConfig,
        });

        chartHtmls.push(chartHtml);
      }

      const siteHtml = TemplateHelper.load('site', {
        title: chartSite.title,
        charts: chartHtmls.join('\n'),
        layoutCols: chartSite.layoutCols,
        layoutRows: chartSite.layoutRows,
      });

      const path = this.context.prepareReportPath(this.type, `${chartSite.name}.html`);

      fs.writeFileSync(path, siteHtml);
    }
  }
}
