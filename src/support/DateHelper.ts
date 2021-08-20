export abstract class DateHelper {
  static lastMonth(date: Date): Date {
    const result = new Date(date);

    result.setDate(0);
    result.setDate(1);

    return result;
  }

  static getMonthStart(timePeriod: number): number {
    const now = new Date().getTime();

    const firstOfMonth = new Date(now - timePeriod);

    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0);
    firstOfMonth.setMinutes(0);
    firstOfMonth.setSeconds(0);
    firstOfMonth.setMilliseconds(0);

    return firstOfMonth.getTime();
  }
}
