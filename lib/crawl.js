module.exports = async (context) => {

  let startAt = 0;
  while (true) {
    const response = await context.request('search', {
      jql: process.env.JIRA_JQL,
      fields: 'issuekey',
      startAt: startAt,
      maxResults: 100,
    });

    if (!Array.isArray(response.issues))
      throw new Error(`Issues missing on search response!`);

    for (const issue of response.issues) {
      const statusChanges = [];

      let issueStartAt = 0;
      while (true) {
        const response = await context.request(`issue/${issue.id}/changelog`, {
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

            statusChanges.push({
              date: entry.created,
              ...entryItem,
            });
          }
        }

        issueStartAt += response.maxResults;

        if (response.isLast || issueStartAt >= response.total) break; // Exit loop
      }

      // TODO: continue here
      console.log(statusChanges);
    }

    startAt += response.maxResults;

    if (startAt >= response.total) break; // Exit loop
  }
};
