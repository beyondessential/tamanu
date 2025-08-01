import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { FormModal } from './FormModal';
import { ChartForm } from '../forms/ChartForm';
import { ChartInstanceInfoSection } from './Charting/ChartInstanceInfoSection';
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
  selectedChartSurveyName,
  coreComplexDataElements,
}) => {
  return (
    <FormModal title={title} open={open} onClose={onClose} data-testid="formmodal-mbvq">
      {complexChartFormMode === COMPLEX_CHART_FORM_MODES.RECORD_CHART_ENTRY ? (
        <StyledChartInstanceInfoSection
          complexChartInstance={complexChartInstance}
          fieldVisibility={fieldVisibility}
          patient={patient}
          selectedChartSurveyName={selectedChartSurveyName}
          coreComplexDataElements={coreComplexDataElements}
        />
      ) : null}
      <ChartForm
        onClose={onClose}
        onSubmit={onSubmit}
        patient={patient}
        chartSurveyId={chartSurveyId}
        data-testid="chartform-iquz"
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
