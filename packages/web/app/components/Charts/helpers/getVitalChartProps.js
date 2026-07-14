import { getTime } from 'date-fns';

import {
  customisedXAxisDateOnlyLabelHeight,
  customisedXAxisLabelHeight,
} from '../components/CustomisedTick';
import { CHART_MARGIN, MULTI_CHARTS_VIEW_INTERVAL_HEIGHT } from '../constants';
import { getXAxisTicks, getYAxisTicks, isTimeShownOnXAxis } from './axisTicks';

export const defaultTableHeight = 500;

export const getVitalChartProps = ({ visualisationConfig, dateRange, isInMultiChartsView }) => {
  const { yAxis: yAxisConfigs } = visualisationConfig;
  const margin = CHART_MARGIN;
  const xAxisTicks = getXAxisTicks(dateRange);
  // The domain comes from the date range rather than the ticks, as the last
  // tick can fall short of the range's end when the range is not an exact
  // multiple of the tick interval.
  const xAxisDomain = dateRange.map(date => getTime(new Date(date)));
  const showTimeOnXAxis = isTimeShownOnXAxis(dateRange);
  const yAxisTicks = getYAxisTicks(yAxisConfigs);
  const tableHeight = isInMultiChartsView
    ? (yAxisTicks.length - 1) * MULTI_CHARTS_VIEW_INTERVAL_HEIGHT
    : defaultTableHeight;
  const xAxisLabelHeight = showTimeOnXAxis
    ? customisedXAxisLabelHeight
    : customisedXAxisDateOnlyLabelHeight;
  const height = tableHeight + xAxisLabelHeight + margin.top + margin.bottom;

  return { xAxisTicks, xAxisDomain, showTimeOnXAxis, yAxisTicks, tableHeight, height, margin };
};
