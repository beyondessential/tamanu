import { describe, expect, it } from 'vitest';
import { getTime } from 'date-fns';

import {
  defaultTableHeight,
  getVitalChartProps,
} from '../../../app/components/Charts/helpers/getVitalChartProps';
import {
  customisedXAxisDateOnlyLabelHeight,
  customisedXAxisLabelHeight,
} from '../../../app/components/Charts/components/CustomisedTick';
import { CHART_MARGIN, MULTI_CHARTS_VIEW_INTERVAL_HEIGHT } from '../../../app/components/Charts/constants';

const visualisationConfig = {
  yAxis: {
    graphRange: { min: 0, max: 10 },
    interval: 5,
    normalRange: { min: 0, max: 10 },
  },
};

const baseArgs = dateRange => ({
  visualisationConfig,
  dateRange,
  isInMultiChartsView: false,
});

describe('getVitalChartProps', () => {
  it('derives the x-axis domain from the date range, not the ticks', () => {
    // A 30-day range whose first tick is snapped forward to the next day
    // boundary, so the first tick timestamp differs from the range start.
    const dateRange = ['2026-06-13 10:30:00', '2026-07-13 10:30:00'];
    const { xAxisDomain, xAxisTicks } = getVitalChartProps(baseArgs(dateRange));

    expect(xAxisDomain).toEqual(dateRange.map(date => getTime(new Date(date))));
    expect(xAxisDomain[0]).not.toBe(xAxisTicks[0]);
  });

  it.each([
    ['24-hour', ['2026-07-12 10:30:00', '2026-07-13 10:30:00'], 'time'],
    ['7-day', ['2026-07-06 10:30:00', '2026-07-13 10:30:00'], 'weekday'],
    ['30-day', ['2026-06-13 10:30:00', '2026-07-13 10:30:00'], 'dayMonthYear'],
    ['1-year', ['2025-07-13 10:30:00', '2026-07-13 10:30:00'], 'monthYear'],
  ])('reports the %s range tick label variant', (_label, dateRange, expectedVariant) => {
    const { xAxisTickLabelVariant } = getVitalChartProps(baseArgs(dateRange));

    expect(xAxisTickLabelVariant).toBe(expectedVariant);
  });

  it.each([
    ['24-hour (two-line "time" labels)', ['2026-07-12 10:30:00', '2026-07-13 10:30:00'], customisedXAxisLabelHeight],
    ['7-day (two-line "weekday" labels)', ['2026-07-06 10:30:00', '2026-07-13 10:30:00'], customisedXAxisLabelHeight],
    ['30-day (single-line "dayMonthYear" labels)', ['2026-06-13 10:30:00', '2026-07-13 10:30:00'], customisedXAxisDateOnlyLabelHeight],
    ['1-year (single-line "monthYear" labels)', ['2025-07-13 10:30:00', '2026-07-13 10:30:00'], customisedXAxisDateOnlyLabelHeight],
  ])('reserves the correct label height for the %s range', (_label, dateRange, expectedLabelHeight) => {
    const { height } = getVitalChartProps(baseArgs(dateRange));

    expect(height).toBe(
      defaultTableHeight + expectedLabelHeight + CHART_MARGIN.top + CHART_MARGIN.bottom,
    );
  });

  it('sizes the table height from the y-axis tick count in multi-charts view', () => {
    const dateRange = ['2026-07-12 10:30:00', '2026-07-13 10:30:00'];
    const { tableHeight, yAxisTicks } = getVitalChartProps({
      visualisationConfig,
      dateRange,
      isInMultiChartsView: true,
    });

    expect(tableHeight).toBe((yAxisTicks.length - 1) * MULTI_CHARTS_VIEW_INTERVAL_HEIGHT);
  });

  it('uses the default table height outside multi-charts view', () => {
    const dateRange = ['2026-07-12 10:30:00', '2026-07-13 10:30:00'];
    const { tableHeight } = getVitalChartProps(baseArgs(dateRange));

    expect(tableHeight).toBe(defaultTableHeight);
  });
});
