import { Dictionary } from '../support/Types';

export interface Project {
  readonly name: string;
  readonly jql: string;
  readonly fields: string[];
  readonly handleResponse?: (responseIssue: Dictionary<any>, issue: Dictionary<any>) => void;
  readonly extendHeaderRow?: (headerRow: Dictionary<any>) => void;
  readonly extendRow?: (row: Dictionary<any>, issue: Dictionary<any>) => void;
}
