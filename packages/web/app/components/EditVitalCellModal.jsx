import React, { useCallback } from 'react';
import { FormModal } from './FormModal';
import { formatShortest, formatTime } from './DateDisplay';
import { EditVitalCellForm } from '../forms/EditVitalCellForm';

export const EditVitalCellModal = ({ open, dataPoint, onClose }) => {
  const vitalLabel = dataPoint?.component.dataElement.name;
  const date = formatShortest(dataPoint?.recordedDate);
  const time = formatTime(dataPoint?.recordedDate);
  const title = `${vitalLabel} | ${date} | ${time}`;
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <FormModal width="sm" title={title} onClose={handleClose} open={open}>
      <EditVitalCellForm vitalLabel={vitalLabel} dataPoint={dataPoint} handleClose={handleClose} />
    </FormModal>
  );
};
