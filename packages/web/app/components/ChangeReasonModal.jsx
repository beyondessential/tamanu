import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';
import { ChangeReasonForm } from '../forms/ChangeReasonForm';

export const ChangeReasonModal = React.memo(({ open, onClose }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const { encounter, writeAndViewEncounter } = useEncounter();
  const onSubmit = useCallback(
    async (data) => {
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
    },
    [encounter, writeAndViewEncounter, navigateToEncounter],
  );

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="encounter.modal.changeReason.title"
          fallback="Change reason for encounter"
          data-testid="translatedtext-etir"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-wd9u"
    >
      <ChangeReasonForm
        onSubmit={onSubmit}
        onCancel={onClose}
        reasonForEncounter={encounter.reasonForEncounter}
        data-testid="changereasonform-dkkr"
      />
    </FormModal>
  );
});

ChangeReasonModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
