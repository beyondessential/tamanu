import React from 'react';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';
import { MultiVitalChartsView } from '../views/charts/MultiVitalChartsView';
import { VitalChartView } from '../views/charts/VitalChartView';

export const VitalChartsModal = React.memo(() => {
  const {
    vitalChartModalOpen,
    setVitalChartModalOpen,
    modalTitle,
    setStartDate,
    setEndDate,
    isInMultiChartsView,
  } = useVitalChartData();

  const ViewComponent = isInMultiChartsView ? MultiVitalChartsView : VitalChartView;

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
      <DateTimeSelector setStartDate={setStartDate} setEndDate={setEndDate} />
      <ViewComponent />
    </Modal>
  );
});
