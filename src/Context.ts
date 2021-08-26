import * as fs from 'fs';

import { Dictionary } from './support/Types';
import { RequestHelper } from './support/RequestHelper';
import { Loader } from './support/Loader';
import { CollectionMapper, Project, PROJECT_VALUE_DEFAULT } from './model/Project';
import { type } from 'os';
import { Issue } from './model/Issue';

export class Context {
  readonly project: Project;
  readonly loader: Loader;

  private readonly basicAuthPlain = `${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`;
  private readonly basicAuth = Buffer.alloc(this.basicAuthPlain.length, this.basicAuthPlain).toString('base64');
  private readonly baseApiUrl = `https://${process.env.JIRA_DOMAIN}/rest/api/${process.env.JIRA_VERSION}/`;

  private readonly baseOutputPath = './output';

  private readonly authHeaders = {
    'Authorization': `Basic ${this.basicAuth}`,
  };

  constructor(project: Project, loader: Loader) {
    this.project = project;
    this.loader = loader;
  }

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

  private prepareGroupPath(): string {
    if (!fs.existsSync(this.baseOutputPath)) fs.mkdirSync(this.baseOutputPath);

    const groupPath = `${this.baseOutputPath}/${this.project.name}`;

    if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath);

    return groupPath;
  };

  private buildPath(id: string): string {
    const groupPath = this.prepareGroupPath();

    return `${groupPath}/${id}.json`;
  };

  readOutput(id: string): any {
    const path = this.buildPath(id);

    if (!fs.existsSync(path)) return null;

    const json = fs.readFileSync(path).toString();

    return JSON.parse(json);
  };

  writeOutput(id: string, content: any): void {
    const path = this.buildPath(id);

    const json = JSON.stringify(content);

    fs.writeFileSync(path, json);
  };

  readAllOutput(mapper: ((input: Dictionary<any>) => Issue)): Dictionary<Issue> {
    const groupPath = this.prepareGroupPath();

    const result: Dictionary<any> = {};

    const files = fs.readdirSync(groupPath);

    for (const file of files) {
      const id = file.split('.')[0];

      try {
        const entry = this.readOutput(id);

        result[id] = mapper(entry);
      } catch (e) {
        console.error(e);

        const path = this.buildPath(id);

        fs.unlinkSync(path);
      }
    }

    return result;
  };

  readAllOutputIssues(): Dictionary<Issue> {
    return this.readAllOutput((entry) => {
      entry.created = new Date(entry.created);
      entry.updated = new Date(entry.updated);
      entry.resolved = entry.resolved ? new Date(entry.resolved) : null;

      for (const statusChange of entry.statusChanges) {
        statusChange.date = new Date(statusChange.date);
      }

      return entry as Issue;
    });
  }

  prepareReportPath(report: string, file: string): string {
    if (!fs.existsSync(this.baseOutputPath)) fs.mkdirSync(this.baseOutputPath);

    const groupPath = `${this.baseOutputPath}/${this.project.name}-reports`;

    if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath);

    if (!report) return groupPath;

    const reportPath = `${groupPath}/${report}`;

    if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);

    if (!file) return reportPath;

    return `${reportPath}/${file}`;
  };

  mapIssueTable(localIssues: Issue[]): Dictionary<any>[] {
    const collections: Dictionary<CollectionMapper> = {
      states: (value: any, id: string): any => {
        if (!value || value[id] === undefined) return PROJECT_VALUE_DEFAULT;

        return value[id].duration;
      },
      ...this.project.collections,
    };

    const collectionMaps: Dictionary<Dictionary<any>> = {};
    for (const collection of Object.keys(collections)) {
      const collectionMap: Dictionary<any> = {};

      for (const localIssue of localIssues) {
        for (const entry of Object.values<any>((localIssue as any)[collection])) {
          const id = entry.id;

          if (collectionMap.hasOwnProperty(id)) continue;

          collectionMap[id] = {
            id: entry.id,
            name: entry.name,
          };
        }
      }

      collectionMaps[collection] = collectionMap;
    }

    const collectionsHeader: Dictionary<string> = {};

    const makeColId = (collection: string, statusId: string) => `${collection}${statusId}`;

    for (const [collection, collectionMap] of Object.entries<any>(collectionMaps)) {
      for (const [id, entry] of Object.entries<any>(collectionMap)) {
        collectionsHeader[makeColId(collection, id)] = entry.name;
      }
    }

    const headerRow: Dictionary<any> = {
      id: 'Id',
      key: 'Key',
      typeId: 'Type Id',
      typeName: 'Type Name',
      statusId: 'Status Id',
      statusName: 'Status Name',
      priorityId: 'Priority Id',
      priorityName: 'Priority Name',
      created: 'Created',
      updated: 'Updated',
      resolved: 'Resolved',
      duration: 'Duration (ms)',
      resolutionId: 'Resolution Id',
      resolutionName: 'Resolution Name',
      ...collectionsHeader,
    };

    this.project.extendHeaderRow(headerRow);

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
        priorityId: localIssue.priority?.id,
        priorityName: localIssue.priority?.name,
        created: JSON.stringify(localIssue.created),
        updated: JSON.stringify(localIssue.updated),
        resolved: localIssue.resolved ? JSON.stringify(localIssue.resolved) : null,
        duration: localIssue.duration,
        resolutionId: localIssue.resolution ? localIssue.resolution.id : null,
        resolutionName: localIssue.resolution ? localIssue.resolution.name : null,
      };

      for (const [collection, collectionMap] of Object.entries<any>(collectionMaps)) {
        for (const entryId of Object.keys(collectionMap)) {
          const value = (localIssue as any)[collection];

          const mapper = collections[collection];

          row[makeColId(collection, entryId)] = mapper(value, entryId);
        }
      }

      this.project.extendRow(row, localIssue);

      normalizedData.push(row);
    }

    return normalizedData;
  }
}
