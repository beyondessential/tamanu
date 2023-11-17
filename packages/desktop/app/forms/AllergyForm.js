import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { useLocalisedText } from '../components/LocalisedText';
import { foreignKey } from '../utils/validation';

export const AllergyForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  allergySuggester,
}) => {
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field
            name="allergyId"
            label="Allergy name"
            component={AutocompleteField}
            suggester={allergySuggester}
            required
          />
          <Field
            name="recordedDate"
            label="Date recorded"
            component={DateField}
            saveDateAsString
            required
          />
          <Field
            name="practitionerId"
            label={clinicianText}
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field name="note" label="Notes" component={TextField} />
          <FormSubmitCancelRow
            onCancel={onCancel}
            onConfirm={submitForm}
            confirmText={editedObject ? 'Save' : 'Add'}
          />
        </FormGrid>
      )}
      initialValues={{
        recordedDate: getCurrentDateTimeString(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        allergyId: foreignKey('An allergy must be selected'),
        recordedDate: yup.date().required(),
      })}
    />
  );
};

AllergyForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

AllergyForm.defaultProps = {
  editedObject: null,
};
