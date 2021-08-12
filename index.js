require('dotenv').config();

require('./lib/validator');

const context = require('./lib/jira');

const crawl = require('./lib/crawl');

(async ()=> {
  await crawl(context);
})();
