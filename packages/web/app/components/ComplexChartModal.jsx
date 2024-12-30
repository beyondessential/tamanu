import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { FormModal } from './FormModal';
import { ChartForm } from '../forms/ChartForm';
import { ChartInstanceInfoSection } from './Charting/ChartInstanceInfoSection';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { COMPLEX_CHART_FORM_MODES } from './Charting/constants';

const StyledChartInstanceInfoSection = styled(ChartInstanceInfoSection)`
  margin-bottom: 20px;
`;

export const ComplexChartModal = ({
  open,
  onClose,
  onSubmit,
  patient,
  title,
  chartSurveyId,
  complexChartInstance,
  complexChartFormMode,
  fieldVisibility,
}) => {
  const { chartInstanceName, chartDate, chartType, chartSubtype } = complexChartInstance || {};
  const isTypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartType] === VISIBILITY_STATUSES.CURRENT;
  const isSubtypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartSubtype] === VISIBILITY_STATUSES.CURRENT;
  
  return (
    <FormModal title={title} open={open} onClose={onClose}>
      {complexChartFormMode === COMPLEX_CHART_FORM_MODES.RECORD_CHART_ENTRY ? (
        <StyledChartInstanceInfoSection
          location={chartInstanceName}
          date={chartDate}
          type={chartType}
          subtype={chartSubtype}
          isTypeVisible={isTypeVisible}
          isSubtypeVisible={isSubtypeVisible}
        />
      ) : null}
      <ChartForm
        onClose={onClose}
        onSubmit={onSubmit}
        patient={patient}
        chartSurveyId={chartSurveyId}
      />
    </FormModal>
  );
};

ComplexChartModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
