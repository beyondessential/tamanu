import React from 'react';
import { Box } from '@material-ui/core';

import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';
import { MultiVitalChartsView } from '../views/charts/MultiVitalChartsView';
import { SingleVitalChartView } from '../views/charts/SingleVitalChartView';
import { VitalMultiChartFilter } from './VitalMultiChartFilter';
import { Modal } from './Modal';

export const VitalChartsModal = React.memo(() => {
  const {
    vitalChartModalOpen,
    setVitalChartModalOpen,
    modalTitle,
    dateRange,
    setDateRange,
    isInMultiChartsView,
  } = useVitalChartData();

  const ViewComponent = isInMultiChartsView ? MultiVitalChartsView : SingleVitalChartView;

  return (
    <Modal
      title={modalTitle}
      open={vitalChartModalOpen}
      width="xl"
      color={Colors.white}
      onClose={() => {
        setVitalChartModalOpen(false);
      }}
    >
      <Box display="flex" justifyContent="space-between">
        <DateTimeSelector dateRange={dateRange} setDateRange={setDateRange} />
        {isInMultiChartsView && <VitalMultiChartFilter />}
      </Box>
      <ViewComponent />
    </Modal>
  );
});
