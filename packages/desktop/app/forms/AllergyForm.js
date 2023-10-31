import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { useLocalisedText } from '../components/LocalisedText';
import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
            label={
              <TranslatedText stringId="forms.allergies.allergyName" fallback="Allergy name" />
            }
            component={AutocompleteField}
            suggester={allergySuggester}
            required
          />
          <Field
            name="recordedDate"
            label={
              <TranslatedText stringId="forms.general.recordedDate" fallback="Date recorded" />
            }
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
          <Field
            name="note"
            label={<TranslatedText stringId="forms.general.notes" fallback="Notes" />}
            component={TextField}
          />
          <ConfirmCancelRow
            onCancel={onCancel}
            onConfirm={submitForm}
            confirmText={
              editedObject ? (
                <TranslatedText stringId="general.actions.save" fallback="Save" />
              ) : (
                <TranslatedText stringId="general.actions.add" fallback="Add" />
              )
            }
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
