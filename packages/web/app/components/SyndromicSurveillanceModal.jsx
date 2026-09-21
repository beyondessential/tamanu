import React from 'react';

import { useEncounterSyndromicSurveillanceMutation } from '../api/mutations/useEncounterSyndromicSurveillanceMutation';
import { SyndromicSurveillanceForm } from '../forms/SyndromicSurveillanceForm';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

const SyndromicSurveillanceModalComponent = ({
  open,
  onClose,
  readOnly,
  encounterId,
  existingData,
  onSaved,
  ...props
}) => {
  const { createSyndromicSurveillance, editSyndromicSurveillance } =
    useEncounterSyndromicSurveillanceMutation(encounterId, {
      onSuccess: onSaved,
    });

  const onSave = async data => {
    if (existingData) {
      await editSyndromicSurveillance(data);
    } else {
      await createSyndromicSurveillance(data);
    }
    onClose();
  };

  return (
    <FormModal
      width="md"
      title={
        <TranslatedText
          stringId="syndromicSurveillance.modal.title"
          fallback="Syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-syndromic-surveillance"
    >
      <SyndromicSurveillanceForm
        onCancel={onClose}
        onSave={onSave}
        readOnly={readOnly}
        existingData={existingData}
        {...props}
        data-testid="syndromicsurveillanceform-modal"
      />
    </FormModal>
  );
};

export const SyndromicSurveillanceModal = React.memo(SyndromicSurveillanceModalComponent);
