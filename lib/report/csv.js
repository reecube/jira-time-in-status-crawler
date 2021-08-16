const fs = require('fs');

const CSV_SEPARATOR_COL = ';';
const CSV_SEPARATOR_ROW = '\n';

module.exports = async (context) => {
  const localIssues = Object.values(context.readAllOutputIssues());

  const issueTable = context.mapIssueTable(localIssues);

  const rowFields = Object.keys(issueTable[0]);

  const csv = issueTable.map(entry => {
    const row = [];

    for (const rowField of rowFields) {
      row.push(entry[rowField]);
    }

    return row.join(CSV_SEPARATOR_COL);
  }).join(CSV_SEPARATOR_ROW);

  const path = context.prepareReportPath('csv', 'default.csv');

  fs.writeFileSync(path, csv);
};
