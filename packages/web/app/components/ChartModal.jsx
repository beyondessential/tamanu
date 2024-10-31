import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from './FormModal';
import { SimpleChartForm } from '../forms/SimpleChartForm';

export const ChartModal = ({ open, onClose, onSubmit, patient, chartName, chartSurveyId }) => {
  return (
    <FormModal title={`${chartName} | Record`} open={open} onClose={onClose}>
      <SimpleChartForm
        onClose={onClose}
        onSubmit={onSubmit}
        patient={patient}
        chartSurveyId={chartSurveyId}
      />
    </FormModal>
  );
};

ChartModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  chartName: PropTypes.string.isRequired,
  surveyId: PropTypes.string.isRequired,
};
