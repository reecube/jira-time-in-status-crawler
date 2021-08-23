import { Dictionary } from '../support/Types';
import { Issue } from './Issue';
import { ChartSite } from './ChartSite';

export const PROJECT_VALUE_DEFAULT = null;
export const PROJECT_BOOLEAN_TRUE = 'true';
export const PROJECT_BOOLEAN_FALSE = 'false';

export type ResponseIssue = Dictionary<any>;
export type CustomIssue = Dictionary<any>;
export type Row = Dictionary<any>;

export type CollectionMapper = (value: any, id: string) => any;

export abstract class Project {
  abstract readonly name: string;
  abstract readonly jql: string;
  abstract readonly fields: string[];
  abstract readonly collections: Dictionary<CollectionMapper>;

  filter(issues: Issue[]): Issue[] {
    return issues;
  }

  abstract buildChartSites(issues: Issue[], options: Dictionary<any>): ChartSite[];

  handleResponse(responseIssue: ResponseIssue, issue: Issue): void {
    // Do nothing
  }

  extendHeaderRow(headerRow: Row): void {
    // Do nothing
  }

  extendRow(row: Row, issue: CustomIssue): void {
    // Do nothing
  }
}
