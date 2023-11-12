import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import { useSuggester } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { ChangeClinicianForm } from '../forms/ChangeClinicianForm';
import { FormModal } from './FormModal';
import { useLocalisedText } from './LocalisedText';
import { TranslatedText } from './Translation/TranslatedText';

const LowerCase = styled.span`
  text-transform: lowercase;
`;

export const ChangeClinicianModal = React.memo(({ open, onClose }) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const { navigateToEncounter } = usePatientNavigation();
  const { encounter, writeAndViewEncounter } = useEncounter();
  const clinicianSuggester = useSuggester('practitioner');
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
          stringId="encounter.modal.changeClinician.title"
          fallback="Change :clinician"
          replacements={{
            clinician: (
              <LowerCase>
                <TranslatedText stringId="general.clinician.shortLabel" fallback={clinicianText} />
              </LowerCase>
            ),
          }}
        />
      }
      open={open}
      onClose={onClose}
    >
      <ChangeClinicianForm
        clinicianSuggester={clinicianSuggester}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
});

ChangeClinicianModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
