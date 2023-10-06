import React, { useCallback } from 'react';
import { Modal } from './Modal';
import { formatShortest, formatTime } from './DateDisplay';
import { EditVitalCellForm } from '../forms/EditVitalCellForm';

export const EditVitalCellModal = ({ open, dataPoint, onClose, components }) => {
  const vitalLabel = dataPoint?.component.dataElement.name;
  const date = formatShortest(dataPoint?.recordedDate);
  const time = formatTime(dataPoint?.recordedDate);
  const title = `${vitalLabel} | ${date} | ${time}`;
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal width="sm" title={title} onClose={handleClose} open={open}>
      <EditVitalCellForm
        vitalLabel={vitalLabel}
        dataPoint={dataPoint}
        components={components}
        handleClose={handleClose}
      />
    </Modal>
  );
};
