import {
  addDays,
  addHours,
  addMonths,
  differenceInDays,
  getTime,
  startOfDay,
  startOfMonth,
} from 'date-fns';

// Ticks with day-or-longer spacing are labelled with a date only, so they are
// snapped forward to day/month boundaries to keep those labels accurate;
// 4-hourly ticks show the time and can sit on the range start as-is.
const ceilToStartOfDay = date => {
  const dayStart = startOfDay(date);
  return dayStart < date ? addDays(dayStart, 1) : dayStart;
};

const ceilToStartOfMonth = date => {
  const monthStart = startOfMonth(date);
  return monthStart < date ? addMonths(monthStart, 1) : monthStart;
};

const X_AXIS_INTERVALS = {
  fourHourly: { addIntervals: addHours, amount: 4, getFirstTickDate: date => date, showTime: true },
  daily: { addIntervals: addDays, amount: 1, getFirstTickDate: ceilToStartOfDay, showTime: false },
  fiveDaily: {
    addIntervals: addDays,
    amount: 5,
    getFirstTickDate: ceilToStartOfDay,
    showTime: false,
  },
  monthly: {
    addIntervals: addMonths,
    amount: 1,
    getFirstTickDate: ceilToStartOfMonth,
    showTime: false,
  },
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
  const { addIntervals, amount, getFirstTickDate } = getXAxisInterval(dateRange);

  const firstTickDate = getFirstTickDate(new Date(startDate));
  const lastTickDate = new Date(endDate);

  const ticks = [];
  // Intervals are always added onto the first tick (rather than the previous
  // tick) so that repeated additions cannot drift or accumulate DST shifts.
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
