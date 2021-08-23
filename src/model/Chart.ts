import { ChartHelper, CustomIssuePreparation } from '../support/ChartHelper';
import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';
import { Issue } from './Issue';
import { ChartConfig } from './ChartConfig';

export abstract class Chart implements CustomIssuePreparation {
  readonly id: string;

  protected readonly options: Dictionary<any>;

  protected readonly helper: ChartHelper;

  constructor(options: Dictionary<any> = {}) {
    this.id = options.id || GeneralHelper.makeId();
    this.options = options;
    this.helper = new ChartHelper(this.options);
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

  protected reduce(grouped: Dictionary<Issue[]>): number[][] {
    return this.helper.reduceByStates(grouped, this.options.stateIds || []);
  }

  filter(issue: Issue): boolean {
    return true;
  }

  protected prepareIssues(issues: Issue[]): Dictionary<Issue[]> {
    return this.helper.prepareIssues(issues, this);
  }

  protected makeChartConfig(groupedValues: number[][]): ChartConfig {
    return this.helper.makeOverviewChartConfig(
      this.helper.makeLabels(groupedValues.length),
      groupedValues,
    );
  }

  buildConfig(issues: Issue[]): Dictionary<any> {
    const grouped = this.prepareIssues(issues);

    const groupedValues = this.reduce(grouped);

    const chartConfig = this.makeChartConfig(groupedValues);

    const options = this.getOptions();

    this.helper.addAnnotations(options, chartConfig);

    return {
      type: this.getChartType(),
      data: chartConfig,
      options: options,
    };
  }
}
