const cliProgress = require('cli-progress');

module.exports = async (context) => {

  const loadingBar = new cliProgress.Bar({
    noTTYOutput: true,
  }, cliProgress.Presets.shades_classic);

  loadingBar.start(1, 0);

  const today = new Date(); // So all calculations will use the same date

  const issues = context.readAllOutput(entry => {
    entry.created = new Date(entry.created);
    entry.updated = new Date(entry.updated);
    entry.resolved = new Date(entry.resolved);

    for (const statusChange of entry.statusChanges) {
      statusChange.date = new Date(statusChange.date);
    }

    return entry;
  });

  let startAt = 0;
  while (true) {
    const response = await context.request('search', {
      jql: process.env.JIRA_JQL,
      fields: 'issuekey,status,created,updated,resolution,resolutiondate',
      startAt: startAt,
      maxResults: 100,
    });

    loadingBar.setTotal(response.total);
    loadingBar.render();

    if (!Array.isArray(response.issues))
      throw new Error(`Issues missing on search response!`);

    for (const respIssue of response.issues) {
      const issueId = respIssue.id;

      const issueUpdated = new Date(respIssue.fields.updated);

      if (issues.hasOwnProperty(issueId)) {
        if (issues[issueId].updated.getTime() === issueUpdated.getTime()) {
          // TODO: solve this
          // console.log(`INFO: Load issue '${issueId}' from cache.`);

          loadingBar.increment();

          continue;
        } else {
          // TODO: solve this
          // console.log(`INFO: Overwrite issue '${issueId}' in cache.`);
        }
      }

      const issueCreated = new Date(respIssue.fields.created);
      const issueResolved = respIssue.fields.resolutiondate ? new Date(respIssue.fields.resolutiondate) : null;

      const issue = {
        id: respIssue.id,
        key: respIssue.key,
        status: {
          id: respIssue.fields.status.id,
          name: respIssue.fields.status.name,
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
        const response = await context.request(`issue/${issueId}/changelog`, {
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

      const addDuration = (from, changeDate) => {
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

      context.writeOutput(issue.id, issue);

      loadingBar.increment();
      loadingBar.render();
    }

    startAt += response.maxResults;

    if (startAt >= response.total) break; // Exit loop
  }

  loadingBar.stop();
};
