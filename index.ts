import { Main } from './src/Main';

require('dotenv').config();

(async () => {
  const main = new Main();

  main.validate();
  await main.run();
})().catch((e) => {
  throw e;
});
