require('dotenv').config();

require('./lib/validator');

const context = require('./lib/context');

const ACTION_CRAWL = 'crawl';
const ACTION_REPORT = 'report';

const ACTIONS = [
  ACTION_CRAWL,
  ACTION_REPORT,
];

(async () => {
  const cliArgs = [...process.argv];

  cliArgs.shift(); // Remove executable path
  cliArgs.shift(); // Remove cwd

  const args = (cliArgs.shift() || '').toLowerCase().split(':');

  const selectedAction = args.shift();

  if (!ACTIONS.includes(selectedAction))
    return console.error(`Invalid action '${selectedAction}'! Please select one of: ${ACTIONS.join(', ')}`);

  switch (selectedAction) {
    case ACTION_CRAWL:
      const crawl = require('./lib/crawl');

      return await crawl(context, args, cliArgs);
    case ACTION_REPORT:
      const report = require('./lib/report');

      const type = args.shift();

      return await report(context, type, args, cliArgs);
    default:
      throw new Error(`Unexpected action '${selectedAction}'!`);
  }
})();
