import React from 'react';

import { SyndromicSurveillanceForm } from '../forms/SyndromicSurveillanceForm';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

const SyndromicSurveillanceModalComponent = ({ open, onClose, ...props }) => {
  const onSave = data => {
    // eslint-disable-next-line no-console
    console.log(data);
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
        {...props}
        data-testid="syndromicsurveillanceform-modal"
      />
    </FormModal>
  );
};

export const SyndromicSurveillanceModal = React.memo(SyndromicSurveillanceModalComponent);
