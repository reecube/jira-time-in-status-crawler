import { PERIOD_DAY, PERIOD_WEEK } from './ChartHelper';

export abstract class DateHelper {
  static substract(date: Date, period: number): Date {
    return new Date(date.getTime() - period);
  }

  static add(date: Date, period: number): Date {
    return new Date(date.getTime() + period);
  }

  static lastWeek(date: Date): Date {
    return this.substract(date, PERIOD_WEEK);
  }

  static lastMonth(date: Date): Date {
    const result = new Date(date);

    result.setDate(0);
    result.setDate(1);

    return result;
  }

  static lastYear(date: Date): Date {
    const result = new Date(date);

    result.setFullYear(date.getFullYear() - 1);

    return result;
  }

  private static resetDay(date: Date): void {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  }

  static firstOfWeek(date: Date, firstDay: number = 1): Date {
    const firstOfWeek = new Date(date.getTime());

    this.resetDay(firstOfWeek);

    const day = firstOfWeek.getDay();

    if (day === firstDay) return firstOfWeek;

    const diffDays = firstDay - day;

    return new Date(firstOfWeek.getTime() + diffDays * PERIOD_DAY);
  }

  static getWeekStart(timePeriod: number, firstDay: number = 1): number {
    const now = new Date().getTime();

    const date = new Date(now - timePeriod);

    return this.firstOfWeek(date, firstDay).getTime();
  }

  static firstOfMonth(date: Date): Date {
    const firstOfMonth = new Date(date.getTime());

    firstOfMonth.setDate(1);
    this.resetDay(firstOfMonth);

    return firstOfMonth;
  }

  static getMonthStart(timePeriod: number): number {
    const now = new Date().getTime();

    const date = new Date(now - timePeriod);

    return this.firstOfMonth(date).getTime();
  }

  static firstOfYear(date: Date): Date {
    const firstOfYear = new Date(date.getTime());

    firstOfYear.setMonth(1);
    firstOfYear.setDate(1);
    this.resetDay(firstOfYear);

    return firstOfYear;
  }

  static getYearStart(timePeriod: number): number {
    const now = new Date().getTime();

    const date = new Date(now - timePeriod);

    return this.firstOfYear(date).getTime();
  }
}
