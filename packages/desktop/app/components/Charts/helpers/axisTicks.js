import { addHours, getTime } from 'date-fns';

export const getXAxisTicks = () => {
  const ticks = [];

  // Get ticks for every 4 hours
  let nextTickTimestamp = getTime(addHours(new Date(), -24));
  for (let i = 0; i <= 6; i++) {
    ticks.push(nextTickTimestamp);
    nextTickTimestamp += 4 * 60 * 60 * 1000;
  }

  return ticks;
};

export const getYAxisTicks = yAxisConfigs => {
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
