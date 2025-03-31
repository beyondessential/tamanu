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
    async data => {
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
          data-test-id='translatedtext-3lua' />
      }
      open={open}
      onClose={onClose}
    >
      <ChangeDietForm
        onSubmit={onSubmit}
        onCancel={onClose}
        dietIds={encounter.diets?.map(diet => diet?.id)}
      />
    </FormModal>
  );
});

ChangeDietModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
