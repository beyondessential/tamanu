import { chartScale } from './constants';
import { BarChartData } from '/interfaces/BarChartProps';

export function normalizeVisitData(
  barChartData: BarChartData[],
): BarChartData[] {
  const maxValue = Math.max(...barChartData.map(data => data.value));
  return barChartData.map((data: BarChartData) => ({
    ...data,
    visits: (data.value * chartScale) / maxValue,
  }));
}
