import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { FormModal } from './FormModal';
import { ChartForm } from '../forms/ChartForm';
import { ChartInstanceInfoSection } from './Charting/ChartInstanceInfoSection';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';

const StyledChartInstanceInfoSection = styled(ChartInstanceInfoSection)`
  margin-bottom: 20px;
`;

export const ChartModal = ({
  open,
  onClose,
  onSubmit,
  patient,
  title,
  chartSurveyId,
  complexChartInstance,
  isRecordingChartEntry,
  fieldVisibility,
}) => {
  const { chartInstanceName, chartDate, chartType, chartSubtype } = complexChartInstance || {};
  const isTypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartType] === VISIBILITY_STATUSES.CURRENT;
  const isSubtypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartSubtype] === VISIBILITY_STATUSES.CURRENT;

  return (
    <FormModal
      title={title}
      open={open}
      onClose={onClose}
      width="md"
      data-testid='formmodal-git8'>
      {isRecordingChartEntry ? (
        <StyledChartInstanceInfoSection
          location={chartInstanceName}
          date={chartDate}
          type={chartType}
          subtype={chartSubtype}
          isTypeVisible={isTypeVisible}
          isSubtypeVisible={isSubtypeVisible}
          data-testid='styledchartinstanceinfosection-390k' />
      ) : null}
      <ChartForm
        onClose={onClose}
        onSubmit={onSubmit}
        patient={patient}
        chartSurveyId={chartSurveyId}
        data-testid='chartform-78ya' />
    </FormModal>
  );
};

ChartModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
