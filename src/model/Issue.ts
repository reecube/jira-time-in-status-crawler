import { Dictionary } from '../support/Types';

export interface IssueReference {
  id: string;
  name: string;
}

export interface IssueStatusChange {
  date: string;
  field: string;
  fieldtype: string;
  fieldId: string;
  from: string;
  fromString: string;
  to: string;
  toString: string;
}

export interface IssueStatus extends IssueReference {
  duration: number,
  firstTransition: Date
  lastTransition: Date
}

export interface Issue {
  id: string;
  key: string;
  type: IssueReference;
  status: IssueReference;
  priority: IssueReference;
  created: Date;
  updated: Date;
  resolved: Date | null;
  duration: number | null;
  resolution: IssueReference | null;
  statusChanges: IssueStatusChange[];
  states: Dictionary<IssueStatus>;
}
