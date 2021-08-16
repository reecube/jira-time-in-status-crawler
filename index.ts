import { Main } from './src/Main';

require('dotenv').config();

let main: Main | null = null;

(async () => {
  main = new Main();

  main.validate();
  await main.run();
})().catch((e) => {
  if (main !== null) main.stop();

  console.error(e);

  process.exit(1);
});
