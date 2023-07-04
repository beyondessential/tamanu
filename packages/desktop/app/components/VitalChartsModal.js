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
    startDate,
    setStartDate,
    setEndDate,
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
      <DateTimeSelector startDate={startDate} setStartDate={setStartDate} setEndDate={setEndDate} />
      <ViewComponent />
    </Modal>
  );
});
