import React from 'react';

import { FormModal } from './FormModal';
import { SimpleChartForm } from '../forms/SimpleChartForm';

export const ChartModal = ({ open, onCancel, onSubmit, patient, chartName, surveyId }) => {
  return (
    <FormModal title={`${chartName} | Record`} open={open} onClose={onCancel}>
      <SimpleChartForm
        onClose={onCancel}
        onSubmit={onSubmit}
        patient={patient}
        surveyId={surveyId}
      />
    </FormModal>
  );
};
