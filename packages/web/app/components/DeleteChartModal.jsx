import React from 'react';
import PropTypes from 'prop-types';

import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DeleteChartModal = ({ open, onClose, handleDeleteChart }) => {
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="chart.modal.delete.title"
          fallback="Delete chart"
          data-testid="translatedtext-wkr6"
        />
      }
      subText={
        <TranslatedText
          stringId="chart.modal.delete.text"
          fallback="Are you sure you would like to delete this chart?"
          data-testid="translatedtext-h9v3"
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={handleDeleteChart}
      cancelButtonText={
        <TranslatedText
          stringId="chart.modal.action.cancel"
          fallback="Cancel"
          data-testid="translatedtext-zsgg"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="chart.modal.action.delete"
          fallback="Delete chart"
          data-testid="translatedtext-1n8h"
        />
      }
      data-testid="confirmmodal-muvq"
    />
  );
};

DeleteChartModal.propTypes = {
  open: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  handleDeleteChart: PropTypes.func.isRequired,
};
