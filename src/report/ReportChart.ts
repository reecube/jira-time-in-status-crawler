import * as fs from 'fs';

import { BaseReport } from './BaseReport';
import { TemplateHelper } from '../support/TemplateHelper';
import { GeneralHelper } from '../support/GeneralHelper';

export class ReportChart extends BaseReport {

  readonly type: string = 'chart';

  async run(): Promise<void> {
    const localIssues = this.context.project.filter(
      Object.values(this.context.readAllOutputIssues()),
    );

    const options = {
      states: {},
      types: {},
      priorities: {},
      resolutions: {},
    };

    for (const issue of localIssues) {
      GeneralHelper.addToCollection(Object.values(issue.states), options.states);
      GeneralHelper.addToCollection(issue.type, options.types);
      GeneralHelper.addToCollection(issue.priority, options.priorities);
      if (issue.resolution) GeneralHelper.addToCollection(issue.resolution, options.resolutions);
    }

    const chartSites = this.context.project.buildChartSites(localIssues, options);

    for (const chartSite of chartSites) {
      const chartHtmls = [];

      for (const chart of chartSite.charts) {
        const chartConfig = chart.buildConfig(localIssues);

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
