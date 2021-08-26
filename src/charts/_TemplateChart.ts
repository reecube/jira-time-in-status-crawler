import { Chart, CHARTTYPE_BAR } from '../model/Chart';

export class _TemplateChart extends Chart {

  protected getTitle(): string {
    return 'TODO';
  }

  protected getChartType(): string {
    return CHARTTYPE_BAR;
  }

  protected getStateIds(): any[] {
    return this.options.stateIds || [
      1,
      2,
      3,
      // TODO
    ];
  }
}
