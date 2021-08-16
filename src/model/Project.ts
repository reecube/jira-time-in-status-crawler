export interface Project {
  readonly name: string;
  readonly jql: string;
  readonly fields: string[];
  readonly handleResponse?: (responseIssue: any, issue: any) => void;
}
