import React from 'react';

import { Form, Field, AutocompleteField } from './Field';
import { ConfirmCancelRow } from './ButtonRow';
import { FormGrid } from './FormGrid';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

const BeginMoveForm = ({ onSubmit, onClose, visit, locationSuggester }) => {
  const renderForm = React.useCallback(({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="plannedLocation._id"
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
      initialValues={{ plannedLocation: visit.plannedLocation }}
    />
  );
};

const FinaliseMoveForm = ({ onSubmit, visit, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to move ${visit.patient[0].firstName} to ${visit.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() => onSubmit({ location: visit.plannedLocation })}
      onCancel={onClose}
    />
  </FormGrid>
);

const CancelMoveForm = ({ onSubmit, visit, onClose }) => (
  <FormGrid columns={1}>
    <div>{`Are you sure you want to cancel ${visit.patient[0].firstName}'s scheduled move to ${visit.plannedLocation.name}?`}</div>
    <ConfirmCancelRow
      onConfirm={() => onSubmit({ plannedLocation: null })}
      confirmText="Yes, cancel"
      cancelText="Keep it"
      onCancel={onClose}
    />
  </FormGrid>
);

const MoverModal = connectApi((api, dispatch, { visit, endpoint }) => ({
  locationSuggester: new Suggester(api, 'location'),
  onSubmit: async data => {
    await api.put(`visit/${visit._id}/${endpoint}`, data);
    dispatch(viewVisit(visit._id));
  },
}))(({ title, open, onClose, Component, ...rest }) => (
  <Modal title={title} open={open} onClose={onClose}>
    <Component onClose={onClose} {...rest} />
  </Modal>
));

export const BeginMoveModal = props => (
  <MoverModal
    {...props}
    Component={BeginMoveForm}
    title="Move patient"
    endpoint="plannedLocation"
  />
);
export const FinaliseMoveModal = props => (
  <MoverModal {...props} Component={FinaliseMoveForm} title="Finalise move" endpoint="location" />
);
export const CancelMoveModal = props => (
  <MoverModal
    {...props}
    Component={CancelMoveForm}
    title="Cancel move"
    endpoint="plannedLocation"
  />
);
