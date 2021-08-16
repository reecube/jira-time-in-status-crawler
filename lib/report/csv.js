const fs = require('fs');

const Loader = require('../loader');

const CSV_SEPARATOR_COL = ';';
const CSV_SEPARATOR_ROW = '\n';

module.exports = async (context) => {
  const loader = Loader();

  loader.start(2, 0);

  const localIssues = Object.values(context.readAllOutputIssues());

  loader.increment();

  const statusMap = {};

  for (const localIssue of localIssues) {
    for (const [id, state] of Object.entries(localIssue.states)) {
      if (statusMap.hasOwnProperty(id)) continue

      statusMap[id] = {
        id: id,
        name: state.name,
      };
    }
  }

  const statusIds = Object.keys(statusMap);

  if (!statusIds.length) throw new Error(`Invalid input data with empty states!`);

  loader.increment();
  loader.reset();
  loader.setTotal(Object.keys(localIssues).length);

  const statusHeader = {};

  const makeStatusColId = statusId => `status${statusId}`;

  for (const [statusId, status] of Object.entries(statusMap)) {
    statusHeader[makeStatusColId(statusId)] = status.name;
  }

  const headerRow = {
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

  const rowFields = Object.keys(headerRow);

  const normalizedData = [
    headerRow,
  ];

  for (const localIssue of localIssues) {
    const row = {
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

    loader.increment();
  }

  loader.reset();

  const csv = normalizedData.map(entry => {
    const row = [];

    for (const rowField of rowFields) {
      row.push(entry[rowField]);
    }

    return row.join(CSV_SEPARATOR_COL);
  }).join(CSV_SEPARATOR_ROW);

  const path = context.prepareReportPath('csv', 'default.csv');

  fs.writeFileSync(path, csv);

  loader.stop();
};
