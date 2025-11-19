import React from 'react';
import { useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router';
import { LineChart } from '../../components/Charts/LineChart';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useEncounter } from '../../contexts/Encounter';
import { useGraphDataQuery } from '../../api/queries/useGraphDataQuery';
import { useProgramRegistryGraphDataQuery } from '../../api/queries/useProgramRegistryGraphDataQuery';
import { useVitalChartData } from '../../contexts/VitalChartData';

export const VitalChartLineChart = props => {
  const { chartKey, visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { isVital } = useVitalChartData();
  const patient = useSelector(state => state.patient);
  const location = useLocation();
  const isProgramRegistryRoute = !!matchPath(
    { path: '/patients/:category/:patientId/program-registry/:programRegistryId', end: false },
    location.pathname,
  );

  const encounterGraphQuery = useGraphDataQuery(encounter?.id, chartKey, dateRange, isVital);
  const programRegistryGraphQuery = useProgramRegistryGraphDataQuery(
    patient?.id,
    chartKey,
    dateRange,
  );

  const { data: chartData, isLoading } =
    !isVital && isProgramRegistryRoute ? programRegistryGraphQuery : encounterGraphQuery;
  const chartProps = getVitalChartProps({
    visualisationConfig,
    dateRange,
    isInMultiChartsView,
  });

  return (
    <LineChart
      chartData={chartData}
      visualisationConfig={visualisationConfig}
      isLoading={isLoading}
      chartProps={chartProps}
      isVital={isVital}
      data-testid="linechart-02ks"
    />
  );
};
