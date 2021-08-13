const cliProgress = require('cli-progress');

module.exports = () => {
  const options = {
    noTTYOutput: true,
  };

  const loadingBar = new cliProgress.Bar(options, cliProgress.Presets.shades_classic);

  return {
    start: (total, startValue = 0, render = false) => {
      loadingBar.start(total, startValue);
      if (render) loadingBar.render();
    },
    reset: (value = 0, render = false) => {
      loadingBar.update(value);
      if (render) loadingBar.render();
    },
    increment: (render = false) => {
      loadingBar.increment();
      if (render) loadingBar.render();
    },
    setTotal: (total, render = false) => {
      loadingBar.setTotal(total);
      if (render) loadingBar.render();
    },
    stop: () => {
      loadingBar.stop();
    },
  };
};
