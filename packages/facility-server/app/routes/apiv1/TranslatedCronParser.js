export class TranslatedCronParser {
  constructor(translationFunc) {
    this.tt = translationFunc;
  }
  atX0SecondsPastTheMinuteGt20() {
    return null;
  }
  atX0MinutesPastTheHourGt20() {
    return null;
  }
  commaMonthX0ThroughMonthX1() {
    return null;
  }
  commaYearX0ThroughYearX1() {
    return null;
  }
  use24HourTimeFormatByDefault() {
    return false;
  }
  anErrorOccuredWhenGeneratingTheExpressionD() {
    return 'An error occured when generating the expression description.  Check the cron expression syntax.';
  }
  everyMinute() {
    return this.tt('everyMinute', 'every minute');
  }
  everyHour() {
    return this.tt('everyHour', 'every hour');
  }
  atSpace() {
    return this.tt('atSpace', 'At ');
  }
  everyMinuteBetweenX0AndX1() {
    return this.tt('everyMinuteBetweenX0AndX1', 'Every minute between %s and %s');
  }
  at() {
    return this.tt('at', 'At');
  }
  spaceAnd() {
    return this.tt('spaceAnd', ' and');
  }
  everySecond() {
    return this.tt('everySecond', 'every second');
  }
  everyX0Seconds() {
    return this.tt('everyNSeconds', 'every %s seconds');
  }
  secondsX0ThroughX1PastTheMinute() {
    return this.tt('secondsX0ThroughX1PastTheMinute', 'seconds %s through %s past the minute');
  }
  atX0SecondsPastTheMinute() {
    return this.tt('atX0SecondsPastTheMinute', 'at %s seconds past the minute');
  }
  everyX0Minutes() {
    return this.tt('everyX0Minutes', 'every %s minutes');
  }
  minutesX0ThroughX1PastTheHour() {
    return this.tt('minutesX0ThroughX1PastTheHour', 'minutes %s through %s past the hour');
  }
  atX0MinutesPastTheHour() {
    return this.tt('atX0MinutesPastTheHour', 'at %s minutes past the hour');
  }
  everyX0Hours() {
    return this.tt('everyX0Hours', 'every %s hours');
  }
  betweenX0AndX1() {
    return this.tt('betweenX0AndX1', 'between %s and %s');
  }
  atX0() {
    return this.tt('atX0', 'at %s');
  }
  commaEveryDay() {
    return this.tt('commaEveryDay', ', every day');
  }
  commaEveryX0DaysOfTheWeek() {
    return this.tt('commaEveryX0DaysOfTheWeek', ', every %s days of the week');
  }
  commaX0ThroughX1() {
    return this.tt('commaX0ThroughX1', ', %s through %s');
  }
  commaAndX0ThroughX1() {
    return this.tt('commaAndX0ThroughX1', ', %s through %s');
  }
  first() {
    return this.tt('first', 'first');
  }
  second() {
    return this.tt('second', 'second');
  }
  third() {
    return this.tt('third', 'third');
  }
  fourth() {
    return this.tt('fourth', 'fourth');
  }
  fifth() {
    return this.tt('fifth', 'fifth');
  }
  commaOnThe() {
    return this.tt('commaOnThe', ', on the ');
  }
  spaceX0OfTheMonth() {
    return this.tt('spaceX0OfTheMonth', ' %s of the month');
  }
  lastDay() {
    return this.tt('lastDay', 'the last day');
  }
  commaOnTheLastX0OfTheMonth() {
    return this.tt('commaOnTheLastX0OfTheMonth', ', on the last %s of the month');
  }
  commaOnlyOnX0() {
    return this.tt('commaOnlyOnX0', ', only on %s');
  }
  commaAndOnX0() {
    return this.tt('commaAndOnX0', ', and on %s');
  }
  commaEveryX0Months() {
    return this.tt('commaEveryX0Months', ', every %s months');
  }
  commaOnlyInX0() {
    return this.tt('commaOnlyInX0', ', only in %s');
  }
  commaOnTheLastDayOfTheMonth() {
    return this.tt('commaOnTheLastDayOfTheMonth', ', on the last day of the month');
  }
  commaOnTheLastWeekdayOfTheMonth() {
    return this.tt('commaOnTheLastWeekdayOfTheMonth', ', on the last weekday of the month');
  }
  commaDaysBeforeTheLastDayOfTheMonth() {
    return this.tt(
      'commaDaysBeforeTheLastDayOfTheMonth',
      ', %s days before the last day of the month',
    );
  }
  firstWeekday() {
    return this.tt('firstWeekday', 'first weekday');
  }
  weekdayNearestDayX0() {
    return this.tt('weekdayNearestDayX0', 'weekday nearest day %s');
  }
  commaOnTheX0OfTheMonth() {
    return this.tt('commaOnTheX0OfTheMonth', ', on the %s of the month');
  }
  commaEveryX0Days() {
    return this.tt('commaEveryX0Days', ', every %s days');
  }
  commaBetweenDayX0AndX1OfTheMonth() {
    return this.tt('commaBetweenDayX0AndX1OfTheMonth', ', between day %s and %s of the month');
  }
  commaOnDayX0OfTheMonth() {
    return this.tt('commaOnDayX0OfTheMonth', ', on day %s of the month');
  }
  commaEveryHour() {
    return this.tt('commaEveryHour', ', every hour');
  }
  commaEveryX0Years() {
    return this.tt('commaEveryX0Years', ', every %s years');
  }
  commaStartingX0() {
    return this.tt('commaStartingX0', ', starting %s');
  }
  daysOfTheWeek() {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
  monthsOfTheYear() {
    return this.tt('monthsOfTheYear', [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  }
}
