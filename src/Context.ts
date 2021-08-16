import * as fs from 'fs';

import { Dictionary } from './support/Types';
import { RequestHelper } from './support/RequestHelper';

export class Context {

  private readonly basicAuthPlain = `${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`;
  private readonly basicAuth = Buffer.alloc(this.basicAuthPlain.length, this.basicAuthPlain).toString('base64');
  private readonly baseApiUrl = `https://${process.env.JIRA_DOMAIN}/rest/api/${process.env.JIRA_VERSION}/`;
  private readonly outputGroup = (process.env.OUTPUT_NAME || 'default').replace(/\W/g, '');

  private readonly baseOutputPath = './output';

  private readonly authHeaders = {
    'Authorization': `Basic ${this.basicAuth}`,
  };

  private getOptions(method: string, custom: Dictionary<any> = {}): Dictionary<any> {
    return {
      'method': method,
      headers: this.authHeaders,
      escape: false,
      ...custom,
    };
  }

  private static buildParameters(parameters: Dictionary<any>): string {
    const result = [];

    for (const entry of Object.entries(parameters)) {
      const [key, value] = entry;

      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    return result.join('&');
  }

  private buildUrl(endpoint: string, parameters: Dictionary<any>): string {
    return `${this.baseApiUrl}${endpoint}?${Context.buildParameters(parameters)}`;
  }

  private static handleResponse(response: string): any {
    return JSON.parse(response);
  }

  async request(endpoint: string, parameters: Dictionary<any>): Promise<any> {
    const url = this.buildUrl(endpoint, parameters);

    const response = await RequestHelper.fetch(url, this.getOptions('GET'));

    return Context.handleResponse(response);
  };

  buildQuery(data: any, postfix: string = ''): string {
    const operator = data.operator;
    const entries = data.entries;

    if (!operator || !Array.isArray(entries)) throw new Error('Invalid buildQuery data parameter value!');

    const entriesString = entries.map(entry => typeof entry === 'string' ? entry : this.buildQuery(entry)).join(` ${operator} `);

    if (!postfix) return `(${entriesString})`;

    return `(${entriesString}) ${postfix}`;
  };

  private prepareGroupPath(group: string): string {
    if (!fs.existsSync(this.baseOutputPath)) fs.mkdirSync(this.baseOutputPath);

    const groupPath = `${this.baseOutputPath}/${group}`;

    if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath);

    return groupPath;
  };

  private buildPath(group: string, id: string): string {
    const groupPath = this.prepareGroupPath(group);

    return `${groupPath}/${id}.json`;
  };

  readOutput(id: string): any {
    const path = this.buildPath(this.outputGroup, id);

    if (!fs.existsSync(path)) return null;

    const json = fs.readFileSync(path).toString();

    return JSON.parse(json);
  };

  writeOutput(id: string, content: any): void {
    const path = this.buildPath(this.outputGroup, id);

    const json = JSON.stringify(content);

    fs.writeFileSync(path, json);
  };

  readAllOutput(mapper: ((input: any) => any)): Dictionary<any> {
    const group = this.outputGroup;

    const groupPath = this.prepareGroupPath(group);

    const result: Dictionary<any> = {};

    const files = fs.readdirSync(groupPath);

    for (const file of files) {
      const id = file.split('.')[0];

      try {
        const entry = this.readOutput(id);

        result[id] = mapper(entry);
      } catch (e) {
        console.error(e);

        const path = this.buildPath(group, id);

        fs.unlinkSync(path);
      }
    }

    return result;
  };

  readAllOutputIssues(): Dictionary<any> {
    return this.readAllOutput(entry => {
      entry.created = new Date(entry.created);
      entry.updated = new Date(entry.updated);
      entry.resolved = entry.resolved ? new Date(entry.resolved) : null;

      for (const statusChange of entry.statusChanges) {
        statusChange.date = new Date(statusChange.date);
      }

      return entry;
    });
  }

  prepareReportPath(report: string, file: string): string {
    const group = this.outputGroup;

    if (!fs.existsSync(this.baseOutputPath)) fs.mkdirSync(this.baseOutputPath);

    const groupPath = `${this.baseOutputPath}/${group}-reports`;

    if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath);

    if (!report) return groupPath;

    const reportPath = `${groupPath}/${report}`;

    if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);

    if (!file) return reportPath;

    return `${reportPath}/${file}`;
  };

  mapIssueTable(localIssues: any[]): Dictionary<any>[] {
    const statusMap: Dictionary<any> = {};

    for (const localIssue of localIssues) {
      for (const [id, state] of Object.entries(localIssue.states)) {
        if (statusMap.hasOwnProperty(id)) continue;

        statusMap[id] = {
          id: id,
          name: (state as any).name,
        };
      }
    }

    const statusIds = Object.keys(statusMap);

    if (!statusIds.length) throw new Error(`Invalid input data with empty states!`);

    const statusHeader: Dictionary<string> = {};

    const makeStatusColId = (statusId: string) => `status${statusId}`;

    for (const [statusId, status] of Object.entries(statusMap)) {
      statusHeader[makeStatusColId(statusId)] = status.name;
    }

    const headerRow: Dictionary<any> = {
      id: 'Id',
      key: 'Key',
      typeId: 'Type Id',
      typeName: 'Type Name',
      statusId: 'Status Id',
      statusName: 'Status Name',
      created: 'Created',
      updated: 'Updated',
      resolved: 'Resolved',
      duration: 'Duration (ms)',
      resolutionId: 'Resolution Id',
      resolutionName: 'Resolution Name',
      ...statusHeader,
    };

    const normalizedData: Dictionary<any>[] = [
      headerRow,
    ];

    for (const localIssue of localIssues) {
      const row: Dictionary<any> = {
        id: localIssue.id,
        key: localIssue.key,
        typeId: localIssue.type.id,
        typeName: localIssue.type.name,
        statusId: localIssue.status.id,
        statusName: localIssue.status.name,
        created: JSON.stringify(localIssue.created),
        updated: JSON.stringify(localIssue.updated),
        resolved: localIssue.resolved ? JSON.stringify(localIssue.resolved) : null,
        duration: localIssue.duration,
        resolutionId: localIssue.resolution ? localIssue.resolution.id : null,
        resolutionName: localIssue.resolution ? localIssue.resolution.name : null,
      };

      for (const statusId of statusIds) {
        row[makeStatusColId(statusId)] = localIssue.states[statusId] ? localIssue.states[statusId].duration : null;
      }

      normalizedData.push(row);
    }

    return normalizedData;
  }
}
