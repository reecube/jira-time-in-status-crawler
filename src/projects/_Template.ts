import { ResponseIssue, Project, PROJECT_VALUE_DEFAULT, Row, CustomIssue } from '../model/Project';
import { Issue } from '../model/Issue';
import { _TemplateChart } from '../charts/_TemplateChart';
import { Dictionary } from '../support/Types';
import { ChartSite } from '../model/ChartSite';

export class _Template extends Project {
  name = 'TODO';
  jql = 'project IN (TODO) AND type IN (TODO)';
  fields = [
    'TODO',
  ];
  collections = {
    'TODO': (value: any, id: string): any => {

      // TODO
      if (!value) return PROJECT_VALUE_DEFAULT;

      return value[id].TODO;
    },
  };

  buildChartSites(issues: Issue[], options: Dictionary<any>): ChartSite[] {
    return [
      new ChartSite([
        new _TemplateChart(options),
      ], 'todo', {
        title: 'IS24 Dashboard',
      }),
    ];
  }

  handleResponse(responseIssue: ResponseIssue, issue: Issue): void {
    (issue as any).customfield = responseIssue.TODO;
  }

  extendHeaderRow(headerRow: Row): void {
    headerRow.customfield = 'TODO';
  }

  extendRow(row: Row, issue: CustomIssue): void {
    row.customfield = issue.customfield;
  }
}
