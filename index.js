require('dotenv').config();

require('./lib/validator');

const context = require('./lib/jira');
const crawl = require("./lib/crawl");

const ACTION_CRAWL = 'crawl';
const ACTION_BUILD = 'build';

const ACTIONS = [
  ACTION_CRAWL,
  ACTION_BUILD,
];

(async () => {
  const selectedAction = (process.argv[2] || '').toLowerCase();

  if (!ACTIONS.includes(selectedAction))
    return console.error(`Invalid action '${selectedAction}'! Please select one of: ${ACTIONS.join(', ')}`);


  switch (selectedAction) {
    case ACTION_CRAWL:
      const crawl = require('./lib/crawl');

      return await crawl(context);
    case ACTION_BUILD:
      const build = require('./lib/build');

      return await build(context);
    default:
      throw new Error(`Unexpected action '${selectedAction}'!`);
  }
})();
