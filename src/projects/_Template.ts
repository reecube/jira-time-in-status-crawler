import { Issue, Project, PROJECT_VALUE_DEFAULT, Row } from '../model/Project';
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
  charts = [
    new _TemplateChart(),
  ];

  handleResponse(responseIssue: Issue, issue: Issue): void {
    issue.customfield = responseIssue.TODO;
  }

  extendHeaderRow(headerRow: Row): void {
    headerRow.customfield = 'TODO';
  }

  extendRow(row: Row, issue: Issue): void {
    row.customfield = issue.customfield;
  }
}
