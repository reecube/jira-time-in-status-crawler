import { Dictionary } from './Types';
import { DateHelper } from './DateHelper';
import { ChartConfig } from '../model/Project';
import * as stats from 'simple-statistics';
import * as _ from 'lodash';
import { Issue } from '../model/Issue';

export const PERIOD_SECOND = 1000;

export const PERIOD_MINUTE = PERIOD_SECOND * 60;

export const PERIOD_HOUR = PERIOD_MINUTE * 60;

export const PERIOD_DAY = PERIOD_HOUR * 24;

export const PERIOD_WEEK = PERIOD_DAY * 7;

export const PERIOD_MONTH = PERIOD_DAY * 30;

export const PERIOD_QUARTER_ONE = PERIOD_MONTH * 3;

export const PERIOD_QUARTER_TWO = PERIOD_MONTH * 6;

export const PERIOD_QUARTER_THREE = PERIOD_MONTH * 9;

export const PERIOD_YEAR = PERIOD_MONTH * 12;

export interface CustomIssuePreparation {
  filter?: (issue: Issue) => boolean;
  sort?: (a: Issue, b: Issue) => number;
  group?: (issue: Issue) => any;
}

export class ChartHelper {
  private readonly options: Dictionary<any>;

  protected colorRequest = 0;

  protected readonly colors: string[];

  constructor(options: Dictionary<any> = {}) {
    this.options = options;
    this.colors = options.colors || [
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
    ];
  }

  nextColor(): string {
    const color = this.colors[this.colorRequest % this.colors.length];

    this.colorRequest += 1;

    return color;
  }

  makeLabel(date: Date): string {
    const localeString = this.options.localeString || 'en-GB';

    const options: Dictionary<any> = {};

    options[this.options.labelType || 'month'] = this.options.labelFormat || 'long';

    return date.toLocaleString(localeString, options);
  }

  makeMonthLabels(amount: number, inputDate: Date = new Date()): string[] {
    const labels: string[] = [];

    let date = new Date(inputDate);

    date.setDate(1);

    for (let i = 0; i < amount; i++) {
      labels.push(this.makeLabel(date));

      date = DateHelper.lastMonth(date);
    }

    return labels.reverse();
  }

  prepareIssues(
    issues: Issue[],
    custom: CustomIssuePreparation = {},
  ): Dictionary<Issue[]> {
    const nowDate = new Date();
    const now = nowDate.getTime();

    const days = this.options.days || 180;

    const timePeriod = days * PERIOD_DAY;

    const filtered = issues.filter((issue) => {
      if (!issue.resolved) return false;

      if ((now - issue.resolved.getTime()) > timePeriod) return false;

      if (!custom.filter) return true;

      return custom.filter(issue);
    }).sort((a, b) => {
      if (custom.sort) return custom.sort(a, b);

      // @ts-ignore
      return a?.resolved?.getTime() - b?.resolved?.getTime();
    });

    if (!filtered.length) {
      console.warn(new Error(`Empty issue list after filter`));

      return {};
    }

    const cbGroup = custom.group || (
      (issue: Issue) => issue.resolved?.getMonth()
    );

    return _.groupBy(filtered, cbGroup);
  }

  reduce(grouped: Dictionary<Issue[]>, stateIds: any[]) {
    const reducer: (group: Issue[]) => number[] = stateIds.length ? (
      group => {
        return group.map((issue: Issue) => {
          let duration = 0;

          for (const stateId of stateIds) {
            // @ts-ignore
            duration += issue.states[stateId.toString()]?.duration || 0;
          }

          return Math.round(duration / PERIOD_DAY);
        });
      }
    ) : (
      group => {
        return group.map((issue: Issue) => {
          // @ts-ignore
          return Math.round(issue.duration / PERIOD_DAY);
        });
      }
    );

    return Object.values(grouped).map(reducer);
  }

  makeOverviewChartConfig(labels: string[], groupedValues: number[][]): ChartConfig {
    const datasets = [];

    datasets.push({
      label: '50% Quantile (days)',
      data: groupedValues.map((it: number[]) => stats.quantile(it, 0.5)),
      backgroundColor: this.nextColor(),
    });

    datasets.push({
      label: '70% Quantile (days)',
      data: groupedValues.map((it: number[]) => stats.quantile(it, 0.7)),
      backgroundColor: this.nextColor(),
    });

    datasets.push({
      label: 'Average (days)',
      data: groupedValues.map((it: number[]) => stats.average(it)),
      backgroundColor: this.nextColor(),
    });

    datasets.push({
      label: 'Standard deviation (days)',
      data: groupedValues.map((it: number[]) => stats.standardDeviation(it)),
      backgroundColor: this.nextColor(),
    });

    return {
      labels,
      datasets,
    };
  }
}
