const options = {
  noTTYOutput: true,
};

const cliProgress = require('cli-progress');

export class Loader {
  private readonly loadingBar = new cliProgress.Bar(
    options,
    cliProgress.Presets.shades_classic,
  );

  start(total: number, startValue: number = 0, render: boolean = false): void {
    this.loadingBar.start(total, startValue);
    if (render) this.loadingBar.render();
  }

  reset(value: number = 0, render: boolean = false): void {
    this.loadingBar.update(value);
    if (render) this.loadingBar.render();
  }

  increment(render: boolean = false): void {
    this.loadingBar.increment();
    if (render) this.loadingBar.render();
  }

  setTotal(total: number, render: boolean = false): void {
    this.loadingBar.setTotal(total);
    if (render) this.loadingBar.render();
  }

  stop(): void {
    this.loadingBar.stop();
  }
}
