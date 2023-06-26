import React from 'react';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { VitalChartView } from '../views/VitalChartView';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';

export const VitalChartsModal = React.memo(() => {
  const {
    vitalChartModalOpen,
    setVitalChartModalOpen,
    modalTitle,
    chartKeys,
    setStartDate,
    setEndDate,
  } = useVitalChartData();

  return (
    <Modal
      title={modalTitle}
      open={vitalChartModalOpen}
      width="lg"
      color={Colors.white}
      onClose={() => {
        setVitalChartModalOpen(false);
      }}
    >
      <DateTimeSelector setStartDate={setStartDate} setEndDate={setEndDate} />
      {chartKeys.map(chartKey => (
        <VitalChartView chartKey={chartKey} key={chartKey} />
      ))}
    </Modal>
  );
});
