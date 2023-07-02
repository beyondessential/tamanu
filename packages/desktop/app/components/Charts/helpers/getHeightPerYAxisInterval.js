export const getHeightPerYAxisInterval = (yAxisConfigs, totalHeight) => {
  const totalNumOfIntervals =
    (yAxisConfigs.graphRange.max - yAxisConfigs.graphRange.min) / yAxisConfigs.interval;
  return totalHeight / totalNumOfIntervals;
};
