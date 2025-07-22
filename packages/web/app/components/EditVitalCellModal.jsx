import React, { useCallback } from 'react';
import { FormModal } from './FormModal';
import { formatShortest, formatTime } from '@tamanu/utils/dateTime';
import { EditVitalCellForm } from '../forms/EditVitalCellForm';
import { TranslatedReferenceData } from './Translation';

export const EditVitalCellModal = ({ open, dataPoint, onClose }) => {
  const vitalLabel = (
    <TranslatedReferenceData
      category="programDataElement"
      value={dataPoint?.component.dataElement.id}
      fallback={dataPoint?.component.dataElement.name}
    />
  );
  const date = formatShortest(dataPoint?.recordedDate);
  const time = formatTime(dataPoint?.recordedDate);
  const title = (
    <span>
      {vitalLabel} | {date} | {time}
    </span>
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <FormModal
      width="sm"
      title={title}
      onClose={handleClose}
      open={open}
      data-testid="formmodal-ufqb"
    >
      <EditVitalCellForm
        vitalLabel={vitalLabel}
        dataPoint={dataPoint}
        handleClose={handleClose}
        data-testid="editvitalcellform-h4wy"
      />
    </FormModal>
  );
};
