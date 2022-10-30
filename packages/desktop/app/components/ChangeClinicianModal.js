import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { useSuggester } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { ChangeClinicianForm } from '../forms/ChangeClinicianForm';
import { Modal } from './Modal';

export const ChangeClinicianModal = React.memo(({ open, onClose }) => {
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
    <Modal title="Change clinician" open={open} onClose={onClose}>
      <ChangeClinicianForm
        clinicianSuggester={clinicianSuggester}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
});

ChangeClinicianModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
