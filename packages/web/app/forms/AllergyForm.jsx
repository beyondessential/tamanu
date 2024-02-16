import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { AutocompleteField, DateField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { FORM_TYPES } from '../constants';

export const AllergyForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  allergySuggester,
}) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="allergyId"
          label={
            <TranslatedText stringId="allergies.form.allergyName.label" fallback="Allergy name" />
          }
          component={AutocompleteField}
          suggester={allergySuggester}
          required
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText stringId="general.form.recordedDate.label" fallback="Date recorded" />
          }
          component={DateField}
          saveDateAsString
          required
        />
        <Field
          name="practitionerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
            />
          }
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="note"
          label={<TranslatedText stringId="general.form.notes.label" fallback="Notes" />}
          component={TextField}
        />
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={
            editedObject ? (
              <TranslatedText stringId="general.action.save" fallback="Save" />
            ) : (
              <TranslatedText stringId="general.action.add" fallback="Add" />
            )
          }
        />
      </FormGrid>
    )}
    initialValues={{
      recordedDate: getCurrentDateTimeString(),
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      allergyId: foreignKey('An allergy must be selected'),
      recordedDate: yup.date().required(),
    })}
  />
);

AllergyForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

AllergyForm.defaultProps = {
  editedObject: null,
};
