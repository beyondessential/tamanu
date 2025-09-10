import React from 'react';
import { Box } from '@material-ui/core';

import { TAMANU_COLORS, Modal } from '@tamanu/ui-components';
import { useVitalChartData } from '../contexts/VitalChartData';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';
import { MultiVitalChartsView } from '../views/charts/MultiVitalChartsView';
import { SingleVitalChartView } from '../views/charts/SingleVitalChartView';
import { VitalMultiChartFilter } from './VitalMultiChartFilter';

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
      color={TAMANU_COLORS.white}
      onClose={() => {
        setVitalChartModalOpen(false);
      }}
      data-testid="modal-uu1i"
    >
      <Box display="flex" justifyContent="space-between" data-testid="box-o9cm">
        <DateTimeSelector
          dateRange={dateRange}
          setDateRange={setDateRange}
          data-testid="datetimeselector-6pwn"
        />
        {isInMultiChartsView && <VitalMultiChartFilter data-testid="vitalmultichartfilter-4l9z" />}
      </Box>
      <ViewComponent data-testid="viewcomponent-43k1" />
    </Modal>
  );
});
