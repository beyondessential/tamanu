import React from 'react';
import PropTypes from 'prop-types';

import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DeleteChartModal = ({ open, onClose, handleDeleteChart }) => {
  return (
    <ConfirmModal
      title={<TranslatedText stringId="chart.modal.delete.title" fallback="Delete chart" />}
      subText={
        <TranslatedText
          stringId="chart.modal.delete.text"
          fallback="Are you sure you want to delete this chart?"
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={handleDeleteChart}
      cancelButtonText={<TranslatedText stringId="chart.modal.action.cancel" fallback="Cancel" />}
      confirmButtonText={
        <TranslatedText stringId="chart.modal.action.delete" fallback="Delete chart" />
      }
    />
  );
};

DeleteChartModal.propTypes = {
  open: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  handleDeleteChart: PropTypes.func.isRequired,
};
