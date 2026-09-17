import React from 'react';

import { SyndromicSurveillanceForm } from '../forms/SyndromicSurveillanceForm';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

const SyndromicSurveillanceModalComponent = ({ open, onClose, readOnly, ...props }) => {
  const onSave = data => {
    // TODO: the "no syndrome" vs symptoms mutual exclusivity is only enforced client-side
    // (disabled checkboxes); once this submits to a real endpoint, validate server-side too,
    // since a user could bypass the UI and submit both.
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
        readOnly={readOnly}
        {...props}
        data-testid="syndromicsurveillanceform-modal"
      />
    </FormModal>
  );
};

export const SyndromicSurveillanceModal = React.memo(SyndromicSurveillanceModalComponent);
