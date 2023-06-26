import React from 'react';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { VitalChartView } from '../views/VitalChartView';

export const VitalChartsModal = React.memo(() => {
  const {
    vitalChartModalOpen,
    setVitalChartModalOpen,
    modalTitle,
    chartKeys,
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
      {chartKeys.map(chartKey => (
        <VitalChartView chartKey={chartKey} key={chartKey} />
      ))}
    </Modal>
  );
});
