import React from 'react';
import { Divider as DividerBase } from '@material-ui/core';
import styled from 'styled-components';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { useVitalChartData } from '../contexts/VitalChartData';
import { VitalChartView } from '../views/VitalChartView';
import { DateTimeSelector } from './Charts/components/DateTimeSelector';
import { CHART_MARGIN, Y_AXIS_WIDTH } from './Charts/constants';

const TitleContainer = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  padding-left: ${Y_AXIS_WIDTH}px;
  padding-top: 15px;
`;

const Divider = styled(DividerBase)`
  margin-left: ${Y_AXIS_WIDTH}px;
  margin-right: ${CHART_MARGIN.right}px;
`;

export const VitalChartsModal = React.memo(() => {
  const {
    vitalChartModalOpen,
    setVitalChartModalOpen,
    visualisationConfigs,
    modalTitle,
    chartKeys,
    setStartDate,
    setEndDate,
    isInMultiChartsView,
  } = useVitalChartData();

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
      {chartKeys.map(chartKey => (
        <>
          <Divider />
          {isInMultiChartsView && (
            <TitleContainer>
              <span>{visualisationConfigs.find(config => config.key === chartKey)?.name}</span>
            </TitleContainer>
          )}
          <VitalChartView chartKey={chartKey} key={chartKey} />
        </>
      ))}
    </Modal>
  );
});
