import { customisedXAxisTickHeight } from '../components/CustomisedTick';
import { CHART_MARGIN, MULTI_CHARTS_VIEW_INTERVAL_HEIGHT } from '../constants';
import { getXAxisTicks, getYAxisTicks } from './axisTicks';

export const defaultTableHeight = 500;

export const getVitalChartProps = ({
  visualisationConfig,
  startDate,
  endDate,
  isInMultiChartsView,
}) => {
  const { yAxis: yAxisConfigs } = visualisationConfig;
  const margin = CHART_MARGIN;
  const xAxisTicks = getXAxisTicks(startDate, endDate);
  const yAxisTicks = getYAxisTicks(yAxisConfigs);
  const tableHeight = isInMultiChartsView
    ? (yAxisTicks.length - 1) * MULTI_CHARTS_VIEW_INTERVAL_HEIGHT
    : defaultTableHeight;
  const height = tableHeight + customisedXAxisTickHeight + margin.top + margin.bottom;

  return { xAxisTicks, yAxisTicks, tableHeight, height, margin };
};
