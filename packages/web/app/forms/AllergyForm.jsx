import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { FORM_TYPES } from '@tamanu/constants/forms';

import {
  AutocompleteField,
  DateField,
  Field,
  SuggesterSelectField,
} from '../components/Field';
import { TextField, Form, FormSubmitCancelRow, FormGrid, useDateTimeFormat } from '@tamanu/ui-components';
import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';

export const AllergyForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  allergySuggester,
}) => {
  const { ability } = useAuth();
  const { getFacilityDateString } = useDateTimeFormat();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid columns={1} data-testid="formgrid-p12d">
          <NoteModalActionBlocker>
            <Field
              name="allergyId"
              label={
                <TranslatedText
                  stringId="allergies.allergyName.label"
                  fallback="Allergy name"
                  data-testid="translatedtext-i74h"
                />
              }
              component={AutocompleteField}
              suggester={allergySuggester}
              required
              allowCreatingCustomValue={canCreateReferenceData}
              data-testid="field-hwfk"
            />
            <Field
              name="reactionId"
              label={
                <TranslatedText
                  stringId="general.reaction.label"
                  fallback="Reaction"
                  data-testid="translatedtext-vcop"
                />
              }
              component={SuggesterSelectField}
              endpoint="reaction"
              data-testid="field-ubz8"
            />
            <Field
              name="recordedDate"
              label={
                <TranslatedText
                  stringId="general.recordedDate.label"
                  fallback="Date recorded"
                  data-testid="translatedtext-zx9d"
                />
              }
              component={DateField}
              saveDateAsString
              required
              data-testid="field-gmf8"
            />
            <Field
              name="practitionerId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  data-testid="translatedtext-uag1"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-ej3a"
            />
            <Field
              name="note"
              label={
                <TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-testid="translatedtext-utdo"
                />
              }
              component={TextField}
              data-testid="field-dayn"
            />
            <FormSubmitCancelRow
              onCancel={onCancel}
              onConfirm={submitForm}
              confirmText={
                editedObject ? (
                  <TranslatedText
                    stringId="general.action.save"
                    fallback="Save"
                    data-testid="translatedtext-8p7h"
                  />
                ) : (
                  <TranslatedText
                    stringId="general.action.add"
                    fallback="Add"
                    data-testid="translatedtext-1jjw"
                  />
                )
              }
              data-testid="formsubmitcancelrow-nx2z"
            />
          </NoteModalActionBlocker>
        </FormGrid>
      )}
      initialValues={{
        recordedDate: getFacilityDateString(),
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        allergyId: foreignKey(),
        recordedDate: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.recordedDate.label"
              fallback="Date recorded"
              data-testid="translatedtext-a51k"
            />,
          ),
      })}
      data-testid="form-jgxg"
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
