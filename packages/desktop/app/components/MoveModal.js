import React from 'react';

import { Form, Field, AutocompleteField } from './Field';
import { ConfirmCancelRow } from './ButtonRow';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

const BeginMoveForm = ({ onSubmit, onClose, visit, locationSuggester }) => {
  const renderForm = React.useCallback(({ submitForm }) => (
    <div>
      <Field
        name="plannedLocation._id"
        component={AutocompleteField}
        suggester={locationSuggester}
        label="New location"
        required
      />
      <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
    </div>
  ));

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{ plannedLocation: visit.plannedLocation }}
    />
  );
};

const FinaliseMoveForm = ({ onSubmit, visit }) => (
  <div>
    <span>Finalise move</span>
    <button onClick={() => onSubmit({ location: visit.plannedLocation })}>ok</button>
  </div>
);

const CancelMoveForm = ({ onSubmit, visit }) => (
  <div>
    <span>Cancel move</span>
    <button onClick={() => onSubmit({ plannedLocation: null })}>ok</button>
  </div>
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

export const BeginMoveModal = (props) => <MoverModal {...props} Component={BeginMoveForm} title="Move patient" endpoint="plannedLocation" />;
export const FinaliseMoveModal = (props) => <MoverModal {...props} Component={FinaliseMoveForm} title="Finalise move" endpoint="location" />;
export const CancelMoveModal = (props) => <MoverModal {...props} Component={CancelMoveForm} title="Cancel move" endpoint="plannedLocation" />;
