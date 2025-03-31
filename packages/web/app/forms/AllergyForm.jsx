import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  TextField,
  SuggesterSelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { foreignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useAuth } from '../contexts/Auth';

export const AllergyForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  allergySuggester,
}) => {
  const { ability } = useAuth();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

  const { getTranslation } = useTranslation();
  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field
            name="allergyId"
            label={
              <TranslatedText
                stringId="allergies.allergyName.label"
                fallback="Allergy name"
                data-testid='translatedtext-xife' />
            }
            component={AutocompleteField}
            suggester={allergySuggester}
            required
            allowCreatingCustomValue={canCreateReferenceData}
            data-testid='field-cozz' />
          <Field
            name="reactionId"
            label={<TranslatedText
              stringId="general.reaction.label"
              fallback="Reaction"
              data-testid='translatedtext-oy8q' />}
            component={SuggesterSelectField}
            endpoint="reaction"
            data-testid='field-qz57' />
          <Field
            name="recordedDate"
            label={
              <TranslatedText
                stringId="general.recordedDate.label"
                fallback="Date recorded"
                data-testid='translatedtext-jl41' />
            }
            component={DateField}
            saveDateAsString
            required
            data-testid='field-v0la' />
          <Field
            name="practitionerId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                data-testid='translatedtext-tt55' />
            }
            component={AutocompleteField}
            suggester={practitionerSuggester}
            data-testid='field-fbr7' />
          <Field
            name="note"
            label={<TranslatedText
              stringId="general.notes.label"
              fallback="Notes"
              data-testid='translatedtext-4akz' />}
            component={TextField}
            data-testid='field-3bbg' />
          <FormSubmitCancelRow
            onCancel={onCancel}
            onConfirm={submitForm}
            confirmText={
              editedObject ? (
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid='translatedtext-6giz' />
              ) : (
                <TranslatedText
                  stringId="general.action.add"
                  fallback="Add"
                  data-testid='translatedtext-ptoc' />
              )
            }
            data-testid='formsubmitcancelrow-8d06' />
        </FormGrid>
      )}
      initialValues={{
        recordedDate: getCurrentDateTimeString(),
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        allergyId: foreignKey(
          getTranslation('validation.rule.mustSelectAllergy', 'An allergy must be selected'),
        ),
        recordedDate: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.recordedDate.label"
              fallback="Date recorded"
              data-testid='translatedtext-1n9r' />,
          ),
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
