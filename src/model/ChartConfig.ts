import { Dictionary } from '../support/Types';

export interface ChartConfig {
  readonly labels: string[];
  readonly datasets: Dictionary<any>[];
}
