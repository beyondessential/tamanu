import React from 'react';

import { Form, Field, AutocompleteField } from './Field';
import { ConfirmCancelRow } from './ButtonRow';
import { FormGrid } from './FormGrid';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

const BeginMoveForm = ({ onSubmit, onClose, encounter, locationSuggester }) => {
  const renderForm = React.useCallback(({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="plannedLocation.id"
        component={AutocompleteField}
        suggester={locationSuggester}
        label="New location"
        required
      />
      <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
    </FormGrid>
  ));

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{ plannedLocation: encounter.plannedLocation }}
    />
  );
};

const FinaliseMoveForm = ({ onSubmit, encounter, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to move ${encounter.patient[0].firstName} to ${encounter.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() => onSubmit({ location: encounter.plannedLocation })}
      onCancel={onClose}
    />
  </FormGrid>
);

const CancelMoveForm = ({ onSubmit, encounter, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to cancel ${encounter.patient[0].firstName}'s scheduled move to ${encounter.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() => onSubmit({ plannedLocation: null })}
      confirmText="Yes, cancel"
      cancelText="Keep it"
      onCancel={onClose}
    />
  </FormGrid>
);

const BaseMoveModal = connectApi((api, dispatch, { encounter, endpoint }) => ({
  locationSuggester: new Suggester(api, 'location'),
  onSubmit: async data => {
    await api.put(`encounter/${encounter.id}/${endpoint}`, data);
    dispatch(viewEncounter(encounter.id));
  },
}))(({ title, open, onClose, Component, ...rest }) => (
  <Modal title={title} open={open} onClose={onClose}>
    <Component onClose={onClose} {...rest} />
  </Modal>
));

export const BeginMoveModal = props => (
  <BaseMoveModal
    {...props}
    Component={BeginMoveForm}
    title="Move patient"
    endpoint="plannedLocation"
  />
);

export const FinaliseMoveModal = props => (
  <BaseMoveModal
    {...props}
    Component={FinaliseMoveForm}
    title="Finalise move"
    endpoint="location"
  />
);

export const CancelMoveModal = props => (
  <BaseMoveModal
    {...props}
    Component={CancelMoveForm}
    title="Cancel move"
    endpoint="plannedLocation"
  />
);
