import { ChartSite, ResponseIssue, Project, PROJECT_VALUE_DEFAULT, Row, CustomIssue } from '../model/Project';
import { Issue } from '../model/Issue';
import { _TemplateChart } from '../charts/_TemplateChart';

export class _Template implements Project {
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

  buildChartSites(data: any): ChartSite[] {
    return [
      new ChartSite([
        new _TemplateChart(),
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
