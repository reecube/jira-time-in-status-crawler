import { BaseReport } from './BaseReport';
import { TemplateHelper } from '../support/TemplateHelper';

export class ReportChart extends BaseReport {

  readonly type: string = 'chart';

  async run(): Promise<void> {
    const localIssues = Object.values(this.context.readAllOutputIssues());

    const issueTable = this.context.mapIssueTable(localIssues);

    const chartHtmls = [];

    for (const chart of this.context.project.charts) {
      const chartConfig = chart.buildConfig(issueTable);

      const chartHtml = TemplateHelper.load('chart', {
        id: chart.id,
        title: chart.title,
        config: chartConfig,
      });

      chartHtmls.push(chartHtml);
    }

    const siteHtml = TemplateHelper.load('site', {
      title: 'TODO', // FIXME
      charts: chartHtmls.join('\n'),
    });

    // TODO: write siteHtml
  }
}
