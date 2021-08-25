import * as stats from 'simple-statistics';
import * as _ from 'lodash';

import { Dictionary } from './Types';
import { DateHelper, PERIOD_DAY } from './DateHelper';
import { Issue } from '../model/Issue';
import { GeneralHelper } from './GeneralHelper';
import { ChartConfig } from '../model/ChartConfig';

export const COLOR_SCHEMES: Dictionary<string[]> = (() => {
  const result: Dictionary<string[]> = {};

  const materialColors = require('material-colors');

  for (const [name, colors] of Object.entries<any>(materialColors)) {
    if (!colors['50'] || !colors['100']) continue;

    result[name] = [
      colors['500'],
      colors['700'],
      colors['900'],
      colors['100'],
      colors['300'],
      colors['600'],
      colors['100'],
      colors['800'],
      colors['400'],
      colors['50'],
    ];
  }

  const getColors = (colorKeys: string [], intensityKey: string): string[] => {
    return colorKeys.map((colorKey: string) => materialColors[colorKey][intensityKey]);
  };

  const rainbowColors = [
    'red',
    'pink',
    'purple',
    'deepPurple',
    'indigo',
    'blue',
    'lightBlue',
    'cyan',
    'teal',
    'green',
    'lightGreen',
    'lime',
    'yellow',
    'amber',
    'orange',
    'deepOrange',
  ];

  result.rainbow = getColors(rainbowColors, '500');
  result.rainbowReversed = getColors(rainbowColors.reverse(), '500');
  result.smooth = getColors([
    'blue',
    'cyan',
    'green',
    'lime',
    'amber',
    'deepOrange',
    'pink',
    'deepPurple',
    'lightBlue',
    'lightGreen',
    'orange',
    'red',
    'purple',
    'indigo',
    'teal',
    'yellow',
  ], '500');
  result.visible = getColors([
    'purple',
    'blue',
    'green',
    'amber',
    'orange',
    'red',
  ], '500');
  result.quality = getColors([
    'red',
    'green',
  ], '500');
  result.priorities = getColors([
    'red',
    'deepOrange',
    'orange',
    'amber',
    'yellow',
    'lime',
    'lightGreen',
    'green',
    'teal',
    'cyan',
    'lightBlue',
    'blue',
    'indigo',
  ], '500');

  return result;
})();

export interface CustomIssuePreparation {
  filter?: (issue: Issue) => boolean;
  sort?: (a: Issue, b: Issue) => number;
  group?: (issue: Issue) => any;
}

const Color = require('color');

export const PERIOD_LABEL_WEEK = 'week';
export const PERIOD_LABEL_MONTH = 'month';
export const PERIOD_LABEL_YEAR = 'year';

const DEFAULT_DAYS = 180;

export class ChartHelper {
  private readonly options: Dictionary<any>;

  protected colorRequest = 0;

  protected readonly colors: string[];

  constructor(options: Dictionary<any> = {}) {
    this.options = options;
    this.colors = options.colors || COLOR_SCHEMES.visible;
  }

  nextColor(): string {
    const color = this.colors[this.colorRequest % this.colors.length];

    this.colorRequest += 1;

    return color;
  }

  private getPeriodLabel(): string {
    return this.options.periodLabel || PERIOD_LABEL_MONTH;
  }

  private firstOf(date: Date): Date {
    const periodLabel = this.getPeriodLabel();

    switch (periodLabel) {
      case PERIOD_LABEL_WEEK:
        return DateHelper.firstOfWeek(date);
      case PERIOD_LABEL_MONTH:
        return DateHelper.firstOfMonth(date);
      case PERIOD_LABEL_YEAR:
        return DateHelper.firstOfYear(date);
      default:
        throw new Error(`Unknown period label type '${periodLabel}'!`);
    }
  }

  private lastPeriod(date: Date): Date {
    const periodLabel = this.getPeriodLabel();

    switch (periodLabel) {
      case PERIOD_LABEL_WEEK:
        return DateHelper.lastWeek(date);
      case PERIOD_LABEL_MONTH:
        return DateHelper.lastMonth(date);
      case PERIOD_LABEL_YEAR:
        return DateHelper.lastYear(date);
      default:
        throw new Error(`Unknown period label type '${periodLabel}'!`);
    }
  }

  private getPeriodStart(time: number): number {
    const periodLabel = this.getPeriodLabel();

    switch (periodLabel) {
      case PERIOD_LABEL_WEEK:
        return DateHelper.getWeekStart(time);
      case PERIOD_LABEL_MONTH:
        return DateHelper.getMonthStart(time);
      case PERIOD_LABEL_YEAR:
        return DateHelper.getYearStart(time);
      default:
        throw new Error(`Unknown period label type '${periodLabel}'!`);
    }
  }

  private getPeriodFormat(short: boolean): string {
    const periodLabel = this.getPeriodLabel();

    switch (periodLabel) {
      case PERIOD_LABEL_WEEK:
        return 'WW';
      case PERIOD_LABEL_MONTH:
        return short ? 'MM' : 'MMMM';
      case PERIOD_LABEL_YEAR:
        return 'YYYY';
      default:
        throw new Error(`Unknown label type '${periodLabel}'!`);
    }
  }

  makeGroupLabel(date: Date): string {
    const periodLabel = this.getPeriodLabel();

    const format = this.getPeriodFormat(false);

    const formatted = DateHelper.format(date, format);

    const labelPrefix = this.options.labelPrefix ??
      (periodLabel === PERIOD_LABEL_WEEK ? 'CW ' : '');
    const labelPostfix = this.options.labelPostfix ?? '';

    return `${labelPrefix}${formatted}${labelPostfix}`;
  }

  makeGroupLabels(): string[] {
    const days = this.options.days || DEFAULT_DAYS;

    const timePeriod = days * PERIOD_DAY;

    const firstValidDate = this.getPeriodStart(timePeriod);

    const labels = [];

    let time = new Date();

    while (time.getTime() > firstValidDate) {
      labels.push(this.makeGroupLabel(time));

      time = this.lastPeriod(time);
    }

    return labels.reverse();
  }

  filterTimeRange(
    issues: Issue[],
    mapDate: (issue: Issue) => Date,
    filter: (issue: Issue) => boolean,
  ): Issue[] {
    const days = this.options.days || DEFAULT_DAYS;

    const timePeriod = days * PERIOD_DAY;

    const firstValidDate = this.getPeriodStart(timePeriod);

    return issues.filter((issue) => {
      const date = mapDate(issue);

      if (!date) return false;

      if (date.getTime() < firstValidDate) return false;

      if (!filter) return true;

      return filter(issue);
    });
  }

  prepareIssues(
    issues: Issue[],
    custom: CustomIssuePreparation,
  ): Dictionary<Issue[]> {
    const sorted = issues.sort((a, b) => {
      if (custom.sort) return custom.sort(a, b);

      // @ts-ignore
      return a?.resolved?.getTime() - b?.resolved?.getTime();
    });

    if (!sorted.length) {
      console.warn(`WARN: Empty issue list after filter`);

      return {};
    }

    const cbGroup = custom.group || (
      (issue: Issue) => this.makeGroupLabel(issue.resolved)
    );

    return _.groupBy(sorted, cbGroup);
  }

  reduceByStates(issue: Issue, stateIds: any[]): number {
    if (!stateIds.length) return Math.round(issue.duration / PERIOD_DAY);

    let duration = 0;

    for (const stateId of stateIds) {
      // @ts-ignore
      duration += issue.states[stateId.toString()]?.duration || 0;
    }

    return Math.round(duration / PERIOD_DAY);
  }

  makeOverviewChartConfig(labels: string[], groupedValues: number[][]): ChartConfig {
    let color: string;

    const datasets = [];

    color = this.nextColor();
    datasets.push({
      label: '50% Quantile (days)',
      data: groupedValues.map(it => !it.length ? 0 : stats.quantile(it, 0.5)),
      backgroundColor: color,
      borderColor: color,
    });

    color = this.nextColor();
    datasets.push({
      label: '70% Quantile (days)',
      data: groupedValues.map(it => !it.length ? 0 : stats.quantile(it, 0.7)),
      backgroundColor: color,
      borderColor: color,
    });

    color = this.nextColor();
    datasets.push({
      label: 'Average (days)',
      data: groupedValues.map(it => !it.length ? 0 : stats.average(it)),
      backgroundColor: color,
      borderColor: color,
    });

    color = this.nextColor();
    datasets.push({
      label: 'Standard deviation (days)',
      data: groupedValues.map(it => !it.length ? 0 : stats.standardDeviation(it)),
      backgroundColor: color,
      borderColor: color,
    });

    return {
      labels,
      datasets,
    };
  }

  makeGroupedChartConfig(labels: string[], aggregated: Dictionary<number[][]>): ChartConfig {
    const datasets = [];

    for (const [group, weeks] of Object.entries<number[][]>(aggregated)) {
      const color = this.nextColor();

      datasets.push({
        label: group,
        data: Object.values(weeks).map(stats.sum),
        backgroundColor: color,
        borderColor: color,
      });
    }

    return {
      labels,
      datasets,
    };
  }

  getStackedOptions(options: Dictionary<any>): Dictionary<any> {
    return GeneralHelper.recursiveMerge(options, {
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
    });
  }

  addAnnotations(options: Dictionary<any>, chartConfig: ChartConfig): void {
    const ref = GeneralHelper.getReferenceByPath('plugins.annotation.annotations', options);

    for (const dataset of chartConfig.datasets) {
      const originalColor = dataset.borderColor || dataset.backgroundColor || dataset.color || '#666';

      const color = new Color(originalColor)
        .alpha(0.5)
        .string();

      let counter = 0;
      const lr = stats.linearRegression(dataset.data.map((y: number) => [counter++, y]));
      const lrl = stats.linearRegressionLine(lr);

      ref[GeneralHelper.makeId()] = {
        drawTime: 'beforeDraw',
        type: 'line',
        yMin: lrl(0),
        yMax: lrl(dataset.data.length - 1),
        borderColor: color,
        borderWidth: 1,
      };
    }

    const goal = this.options.goal;

    if (goal) {
      const isNumber = typeof goal === 'number';

      const yMin = isNumber ? goal : goal.min;
      const yMax = isNumber ? goal : goal.max;

      const backgroundColor = this.options.goalColor || 'rgba(0,0,0,0.5)';
      const color = this.options.goalTextColor || '#fff';

      const label = this.options.goalLabel || `Goal ${isNumber ? goal : `${yMin} - ${yMax}`}`;

      ref[GeneralHelper.makeId()] = {
        drawTime: 'afterDraw',
        type: 'line',
        yMin: yMin,
        yMax: yMax,
        borderColor: backgroundColor,
        borderWidth: 2,
        label: {
          enabled: true,
          content: label,
          backgroundColor,
          color,
          font: {
            family: 'sans-serif',
            size: 8,
            style: 'normal',
          },
        },
      };
    }
  }
}
