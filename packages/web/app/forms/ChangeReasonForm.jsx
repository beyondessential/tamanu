import React from 'react';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { FORM_TYPES } from '../constants';
import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';

export const ChangeReasonForm = ({ onCancel, onSubmit, reasonForEncounter }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="reasonForEncounter"
        label={<TranslatedText stringId="general.localisedField.reasonForEncounter.label" fallback="Reason for encounter" />}
        component={TextField}
        multiline
        rows={3}
      />
      <ModalActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
        reasonForEncounter,
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};

ChangeReasonForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  reasonForEncounter: PropTypes.string.isRequired,
};
