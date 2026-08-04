import { getTime } from 'date-fns';

import {
  customisedXAxisDateOnlyLabelHeight,
  customisedXAxisLabelHeight,
} from '../components/CustomisedTick';
import { CHART_MARGIN, MULTI_CHARTS_VIEW_INTERVAL_HEIGHT } from '../constants';
import { getXAxisTickLabelVariant, getXAxisTicks, getYAxisTicks } from './axisTicks';

export const defaultTableHeight = 500;

// Variants with two stacked label lines need the taller reserved height;
// single-line variants need only the shorter one.
const TWO_LINE_TICK_LABEL_VARIANTS = ['time', 'weekday'];

export const getVitalChartProps = ({ visualisationConfig, dateRange, isInMultiChartsView }) => {
  const { yAxis: yAxisConfigs } = visualisationConfig;
  const margin = CHART_MARGIN;
  const xAxisTicks = getXAxisTicks(dateRange);
  // The domain comes from the date range rather than the ticks, as the last
  // tick can fall short of the range's end when the range is not an exact
  // multiple of the tick interval.
  const xAxisDomain = dateRange.map(date => getTime(new Date(date)));
  const xAxisTickLabelVariant = getXAxisTickLabelVariant(dateRange);
  const yAxisTicks = getYAxisTicks(yAxisConfigs);
  const tableHeight = isInMultiChartsView
    ? (yAxisTicks.length - 1) * MULTI_CHARTS_VIEW_INTERVAL_HEIGHT
    : defaultTableHeight;
  const xAxisLabelHeight = TWO_LINE_TICK_LABEL_VARIANTS.includes(xAxisTickLabelVariant)
    ? customisedXAxisLabelHeight
    : customisedXAxisDateOnlyLabelHeight;
  const height = tableHeight + xAxisLabelHeight + margin.top + margin.bottom;

  return {
    xAxisTicks,
    xAxisDomain,
    xAxisTickLabelVariant,
    yAxisTicks,
    tableHeight,
    height,
    margin,
  };
};
