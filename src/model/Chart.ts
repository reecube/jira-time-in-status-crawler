import { ChartHelper, CustomIssuePreparation } from '../support/ChartHelper';
import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';
import { Issue } from './Issue';
import { ChartConfig } from './ChartConfig';

export abstract class Chart implements CustomIssuePreparation {
  readonly id: string;

  protected readonly options: Dictionary<any>;

  protected readonly helper: ChartHelper;

  protected customizeOptions(): void {
    // Overwrite this on inherited classes if needed
  }

  constructor(options: Dictionary<any> = {}) {
    this.id = options.id || GeneralHelper.makeId();
    this.options = options;
    this.helper = new ChartHelper(this.options);

    this.customizeOptions();
  }

  protected getChartType(): string {
    return 'line';
  }

  protected getTitle(): string {
    return '';
  }

  protected getOptions(): Dictionary<any> {
    const title = this.getTitle();

    return {
      responsive: false,
      aspectRatio: 1.5,
      plugins: {
        title: {
          display: !!title,
          text: title,
        },
      },
    };
  }

  filter(issue: Issue): boolean {
    return true;
  }

  protected prepareIssues(issues: Issue[]): Dictionary<Issue[]> {
    return this.helper.prepareIssues(issues, this);
  }

  protected makeChartConfig(grouped: Dictionary<Issue[]>): ChartConfig {
    const stateIds = this.options.stateIds || [];

    const datasets = Object.values(grouped).map((group: Issue[]) => {
      return group.map((issue: Issue) => {
        return this.helper.reduceByStates(issue, stateIds);
      });
    });

    return this.helper.makeOverviewChartConfig(
      this.helper.makeLabels(datasets.length),
      datasets,
    );
  }

  buildConfig(issues: Issue[]): Dictionary<any> {
    const grouped = this.prepareIssues(issues);

    const chartConfig = this.makeChartConfig(grouped);

    const options = this.getOptions();

    if (this.options.showAnnotations ?? true)
      this.helper.addAnnotations(options, chartConfig);

    return {
      type: this.getChartType(),
      data: chartConfig,
      options: options,
    };
  }
}
