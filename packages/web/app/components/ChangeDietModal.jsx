import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';
import { ChangeDietForm } from '../forms/ChangeDietForm';

export const ChangeDietModal = React.memo(({ open, onClose }) => {
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
          stringId="encounter.modal.changeDiet.title"
          fallback="Change diet"
          data-testid="translatedtext-b2im"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-anbb"
    >
      <ChangeDietForm
        onSubmit={onSubmit}
        onCancel={onClose}
        dietIds={encounter.diets?.map((diet) => diet?.id)}
        data-testid="changedietform-2vn0"
      />
    </FormModal>
  );
});

ChangeDietModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
