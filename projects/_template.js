module.exports = {
  jql: 'TODO',
  fields: [
    'TODO',
  ],
  handleResponse: (responseIssue, issue) => {
    issue.customfield = responseIssue.TODO;
  },
  extendHeaderRow: (headerRow) => {
    headerRow.customfield = 'TODO';
  },
  extendRow: (row, issue) => {
    row.customfield = issue.customfield;
  },
};
