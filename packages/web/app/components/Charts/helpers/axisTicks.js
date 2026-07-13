import { addDays, addHours, addMonths, differenceInDays, getTime } from 'date-fns';

const X_AXIS_INTERVALS = {
  fourHourly: { addIntervals: addHours, amount: 4, showTime: true },
  daily: { addIntervals: addDays, amount: 1, showTime: false },
  fiveDaily: { addIntervals: addDays, amount: 5, showTime: false },
  monthly: { addIntervals: addMonths, amount: 1, showTime: false },
};

const getXAxisInterval = dateRange => {
  const [startDate, endDate] = dateRange;
  const rangeInDays = differenceInDays(new Date(endDate), new Date(startDate));
  if (rangeInDays > 30) return X_AXIS_INTERVALS.monthly;
  if (rangeInDays > 7) return X_AXIS_INTERVALS.fiveDaily;
  if (rangeInDays > 2) return X_AXIS_INTERVALS.daily;
  return X_AXIS_INTERVALS.fourHourly;
};

export const getXAxisTicks = dateRange => {
  const [startDate, endDate] = dateRange;
  const { addIntervals, amount } = getXAxisInterval(dateRange);

  const ticks = [];
  const firstTickDate = new Date(startDate);
  const lastTickDate = new Date(endDate);
  // Intervals are always added onto the first tick (rather than the previous
  // tick) so that monthly steps track the start date's day of the month
  // instead of drifting when clamped by a shorter month.
  for (
    let intervalCount = 0, tickDate = firstTickDate;
    tickDate <= lastTickDate;
    intervalCount += 1, tickDate = addIntervals(firstTickDate, intervalCount * amount)
  ) {
    ticks.push(getTime(tickDate));
  }

  return ticks;
};

export const isTimeShownOnXAxis = dateRange => getXAxisInterval(dateRange).showTime;

export const getYAxisTicks = (yAxisConfigs) => {
  const { graphRange, interval } = yAxisConfigs;

  const ticks = [];

  for (let i = graphRange.min; i <= graphRange.max; i += interval) {
    ticks.push(i);
  }

  if (ticks[ticks.length - 1] !== graphRange.max) {
    ticks.push(graphRange.max);
  }

  return ticks;
};
