import React, { useCallback } from 'react';
import { FormModal } from './FormModal';
import { EditVitalCellForm } from '../forms/EditVitalCellForm';
import { TranslatedReferenceData } from './Translation';
import { DateDisplay } from '@tamanu/ui-components';

export const EditVitalCellModal = ({
  open,
  dataPoint,
  onClose,
  isVital = false,
  // Program registry context props (optional)
  programRegistryPatientId,
  programRegistrySurveyId,
  programRegistryInstanceId,
  isPatientRemoved = false,
}) => {
  const vitalLabel = (
    <TranslatedReferenceData
      category="programDataElement"
      value={dataPoint?.component.dataElement.id}
      fallback={dataPoint?.component.dataElement.name}
    />
  );
  const title = (
    <span>
      {vitalLabel} | <DateDisplay date={dataPoint?.recordedDate} shortYear /> |{' '}
      <DateDisplay date={dataPoint?.recordedDate} showTime showDate={false} />
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
        isVital={isVital}
        vitalLabel={vitalLabel}
        dataPoint={dataPoint}
        handleClose={handleClose}
        programRegistryPatientId={programRegistryPatientId}
        programRegistrySurveyId={programRegistrySurveyId}
        programRegistryInstanceId={programRegistryInstanceId}
        isPatientRemoved={isPatientRemoved}
        data-testid="editvitalcellform-h4wy"
      />
    </FormModal>
  );
};
