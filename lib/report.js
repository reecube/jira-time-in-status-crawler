const REPORT_TYPE_CSV = 'csv';
const REPORT_TYPE_HTML = 'html';
const REPORT_TYPE_IMAGE = 'image';

module.exports = async (context, type, args, cliArgs) => {
  switch (type) {
    case REPORT_TYPE_CSV:
      const csv = require('./report/csv');

      return await csv(context, args, cliArgs);
    case REPORT_TYPE_HTML:
      const html = require('./report/html');

      return await html(context, args, cliArgs);
    case REPORT_TYPE_IMAGE:
      const image = require('./report/image');

      return await image(context, args, cliArgs);
    default:
      throw new Error(`Unknown report type '${type}'!`);
  }
};
