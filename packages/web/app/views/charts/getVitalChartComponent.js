import { BLOOD_PRESSURE, LINE, VITAL_CHARTS } from '@tamanu/constants/surveys';
import { VitalBloodPressureChart } from './VitalBloodPressureChart';
import { VitalChartLineChart } from './VitalChartLineChart';

const VITAL_GRAPHS_MAPPING = {
  [BLOOD_PRESSURE]: VitalBloodPressureChart,
  [LINE]: VitalChartLineChart,
};

const getVitalGraphComponent = (chartKey) => {
  const chartType = VITAL_CHARTS[chartKey];
  if (!chartType) {
    return VitalChartLineChart;
  }

  const VitalGraphComponent = VITAL_GRAPHS_MAPPING[chartType];
  return VitalGraphComponent;
}

const getChartGraphComponent = () => {
  return VitalChartLineChart;
}

export const getVitalChartComponent = (chartKey, isVital) => {
  if (isVital) {
    return getVitalGraphComponent(chartKey);
  }
  return getChartGraphComponent();
};
