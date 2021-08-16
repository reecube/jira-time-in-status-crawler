import { BaseAction } from './BaseAction';

import { Loader } from '../support/Loader';
import { Dictionary } from '../support/Types';

export class Crawl extends BaseAction {

  readonly type: string = 'crawl';

  async run(): Promise<void> {
    const loader = new Loader();

    loader.start(1, 0);

    const today = new Date(); // So all calculations will use the same date

    const issues = this.context.readAllOutputIssues();

    let startAt = 0;
    while (true) {
      const response = await this.context.request('search', {
        jql: process.env.JIRA_JQL,
        fields: 'issuekey,issuetype,status,created,updated,resolution,resolutiondate,priority',
        startAt: startAt,
        maxResults: 100,
      });

      loader.setTotal(response.total);

      if (!Array.isArray(response.issues))
        throw new Error(`Issues missing on search response!`);

      for (const respIssue of response.issues) {
        const issueId = respIssue.id;

        const issueUpdated = new Date(respIssue.fields.updated);

        if (issues.hasOwnProperty(issueId)) {
          if (issues[issueId].updated.getTime() === issueUpdated.getTime()) {
            // TODO: solve this
            // console.log(`INFO: Load issue '${issueId}' from cache.`);

            loader.increment(false);

            continue;
          } else {
            // TODO: solve this
            // console.log(`INFO: Overwrite issue '${issueId}' in cache.`);
          }
        }

        const issueCreated = new Date(respIssue.fields.created);
        const issueResolved = respIssue.fields.resolutiondate ? new Date(respIssue.fields.resolutiondate) : null;

        const issue: Dictionary<any> = {
          id: respIssue.id,
          key: respIssue.key,
          type: {
            id: respIssue.fields.issuetype.id,
            name: respIssue.fields.issuetype.name,
          },
          status: {
            id: respIssue.fields.status.id,
            name: respIssue.fields.status.name,
          },
          priority: {
            id: respIssue.fields.priority.id,
            name: respIssue.fields.priority.name,
          },
          created: issueCreated,
          updated: issueUpdated,
          resolved: issueResolved,
          duration: issueResolved ? issueResolved.getTime() - issueCreated.getTime() : null,
          resolution: respIssue.fields.resolution ? {
            id: respIssue.fields.resolution.id,
            name: respIssue.fields.resolution.name,
          } : null,
          statusChanges: [],
          states: {},
        };

        issues[issueId] = issue;

        let issueStartAt = 0;
        while (true) {
          const response = await this.context.request(`issue/${issueId}/changelog`, {
            startAt: issueStartAt,
            maxResults: 100,
          });

          if (!Array.isArray(response.values))
            throw new Error(`Values missing on issue history response!`);

          for (const entry of response.values) {

            if (!Array.isArray(entry.items))
              throw new Error(`Items missing on issue history response value!`);

            for (const entryItem of entry.items) {
              if (entryItem.field !== 'status') continue;

              issue.statusChanges.push({
                date: entry.created,
                ...entryItem,
              });
            }
          }

          issueStartAt += response.maxResults;

          if (response.isLast || issueStartAt >= response.total) break; // Exit loop
        }

        let lastTimestamp = issue.created.getTime();

        const addDuration = (from: any, changeDate: Date) => {
          const changeTimestamp = changeDate.getTime();

          if (!issue.states.hasOwnProperty(from.id)) {
            issue.states[from.id] = {
              ...from,
              duration: 0,
              firstTransition: changeDate,
              lastTransition: changeDate,
            };
          }

          const duration = changeTimestamp - lastTimestamp;

          issue.states[from.id].duration += duration;
          issue.states[from.id].lastTransition = changeDate;

          lastTimestamp = changeTimestamp;
        };

        for (const rawStatusChange of issue.statusChanges) {
          const statusChange = {
            date: new Date(rawStatusChange.date),
            from: {
              id: rawStatusChange.from,
              name: rawStatusChange.fromString,
            },
            to: {
              id: rawStatusChange.to,
              name: rawStatusChange.toString,
            },
          };

          addDuration(statusChange.from, statusChange.date);
        }

        addDuration(issue.status, today);

        this.context.writeOutput(issue.id, issue);

        loader.increment();
      }

      startAt += response.maxResults;

      if (startAt >= response.total) break; // Exit loop
    }

    loader.stop();
  }
}
