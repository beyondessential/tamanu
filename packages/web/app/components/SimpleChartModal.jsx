import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from './FormModal';
import { ChartForm } from '../forms/ChartForm';

export const SimpleChartModal = ({ open, onClose, onSubmit, patient, title, chartSurveyId }) => (
  <FormModal title={title} open={open} onClose={onClose} data-testid="formmodal-i1f6">
    <ChartForm
      onClose={onClose}
      onSubmit={onSubmit}
      patient={patient}
      chartSurveyId={chartSurveyId}
      data-testid="chartform-eqrz"
    />
  </FormModal>
);

SimpleChartModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
