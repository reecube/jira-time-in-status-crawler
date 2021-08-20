export abstract class DateHelper {
  static lastMonth(date: Date): Date {
    const result = new Date(date);

    result.setDate(0);
    result.setDate(1);

    return result;
  }
}
