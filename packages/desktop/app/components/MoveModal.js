import React, { useCallback } from 'react';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { useEncounter } from '../contexts/Encounter';
import { useSuggester } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { Form, Field, AutocompleteField } from './Field';
import { ConfirmCancelRow } from './ButtonRow';
import { FormGrid } from './FormGrid';
import { Modal } from './Modal';

export const MoveModal = ({ open, onClose, encounter }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const { writeAndViewEncounter } = useEncounter();
  const movePatient = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
      onClose();
    },
    [encounter, writeAndViewEncounter, onClose, navigateToEncounter],
  );

  return (
    <Modal title="Move patient" open={open} onClose={onClose}>
      <MoveForm
        onClose={onClose}
        onSubmit={movePatient}
        encounter={encounter}
        locationSuggester={locationSuggester}
      />
    </Modal>
  );
};

const MoveForm = ({ onSubmit, onClose, encounter, locationSuggester }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="locationId"
          component={AutocompleteField}
          suggester={locationSuggester}
          label="New location"
          required
        />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [locationSuggester, onClose],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        locationId: encounter.location.id,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
    />
  );
};

// -------------------------------------------------------------------------------
// TODO: Reimplement "planned move" functionality on backend.
// Keeping the display components for that here so that they can be used later.
// They should just need the endpoints updated to match the new API, and to
// be re-added to EncounterView.js (PR 786)

const BeginMoveForm = ({ onSubmit, onClose, encounter, locationSuggester }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="plannedLocationId"
          component={AutocompleteField}
          suggester={locationSuggester}
          label="New location"
          required
        />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [locationSuggester, onClose],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        plannedLocationId: encounter.plannedLocationId,
        submittedTime: getCurrentDateTimeString(),
      }}
    />
  );
};
const FinaliseMoveForm = ({ onSubmit, encounter, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to move patient to ${encounter.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() =>
        onSubmit({
          locationId: encounter.plannedLocation.id,
        })
      }
      onCancel={onClose}
    />
  </FormGrid>
);

const CancelMoveForm = ({ onSubmit, encounter, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to cancel patient's scheduled move to ${encounter.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() => onSubmit({ plannedLocationId: null })}
      confirmText="Yes, cancel"
      cancelText="Keep it"
      onCancel={onClose}
    />
  </FormGrid>
);

const BaseMoveModal = ({ title, open, onClose, Component, encounter, ...rest }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const { writeAndViewEncounter } = useEncounter();
  const onSubmit = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
      onClose();
    },
    [encounter, writeAndViewEncounter, onClose, navigateToEncounter],
  );

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <Component
        onClose={onClose}
        onSubmit={onSubmit}
        encounter={encounter}
        locationSuggester={locationSuggester}
        {...rest}
      />
    </Modal>
  );
};

export const BeginMoveModal = props => (
  <BaseMoveModal {...props} Component={BeginMoveForm} title="Move patient" />
);

export const FinaliseMoveModal = props => (
  <BaseMoveModal {...props} Component={FinaliseMoveForm} title="Finalise move" />
);

export const CancelMoveModal = props => (
  <BaseMoveModal {...props} Component={CancelMoveForm} title="Cancel move" />
);
