import React from 'react';
import PropTypes from 'prop-types';

import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DeleteChartModal = ({ open, onClose, handleDeleteChart }) => {
  return (
    <ConfirmModal
      title={<TranslatedText
        stringId="chart.modal.delete.title"
        fallback="Delete chart"
        data-testid='translatedtext-6xa8' />}
      subText={
        <TranslatedText
          stringId="chart.modal.delete.text"
          fallback="Are you sure you want to delete this chart?"
          data-testid='translatedtext-3vs7' />
      }
      open={open}
      onCancel={onClose}
      onConfirm={handleDeleteChart}
      cancelButtonText={<TranslatedText
        stringId="chart.modal.action.cancel"
        fallback="Cancel"
        data-testid='translatedtext-vhh1' />}
      confirmButtonText={
        <TranslatedText
          stringId="chart.modal.action.delete"
          fallback="Delete chart"
          data-testid='translatedtext-q59p' />
      }
    />
  );
};

DeleteChartModal.propTypes = {
  open: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  handleDeleteChart: PropTypes.func.isRequired,
};
