import React from 'react';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';
import { MultiVitalChartsView } from '../views/charts/MultiVitalChartsView';
import { SingleVitalChartView } from '../views/charts/SingleVitalChartView';

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
      <DateTimeSelector dateRange={dateRange} setDateRange={setDateRange} />
      <ViewComponent />
    </Modal>
  );
});
