import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { trimToDate } from '@tamanu/utils/dateTime';
import {
  TextField,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  useDateTime,
} from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { AutocompleteField, DateField, Field } from '../components/Field';
import { foreignKey, optionalForeignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';

export const FamilyHistoryForm = ({
  onCancel,
  diagnosisSuggester,
  practitionerSuggester,
  editedObject,
  onSubmit,
}) => {
  const { getCurrentDate } = useDateTime();
  const getInitialValues = () => {
    if (editedObject) {
      // Currently the recordedDate is a dateTime type in the database, so we need to convert it to date type
      // for now to avoid timezone conversion
      return {
        ...editedObject,
        recordedDate: trimToDate(editedObject.recordedDate),
      };
    }
    return {
      recordedDate: getCurrentDate(),
    };
  };
  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid columns={1} data-testid="formgrid-kjns">
          <NoteModalActionBlocker>
            <Field
              name="diagnosisId"
              label={
                <TranslatedText
                  stringId="general.diagnosis.label"
                  fallback="Diagnosis"
                  data-testid="translatedtext-dnu5"
                />
              }
              required
              component={AutocompleteField}
              suggester={diagnosisSuggester}
              data-testid="field-3b4u"
            />
            <Field
              name="recordedDate"
              label={
                <TranslatedText
                  stringId="general.recordedDate.label"
                  fallback="Date recorded"
                  data-testid="translatedtext-vped"
                />
              }
              required
              component={DateField}
              data-testid="field-wrp3"
            />
            <Field
              name="relationship"
              label={
                <TranslatedText
                  stringId="familyHistory.relations.label"
                  fallback="Relation to patient"
                  data-testid="translatedtext-vl82"
                />
              }
              component={TextField}
              data-testid="field-t0k5"
            />
            <Field
              name="practitionerId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  data-testid="translatedtext-f8e8"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-kbwi"
            />
            <Field
              name="note"
              label={
                <TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-testid="translatedtext-428i"
                />
              }
              component={TextField}
              multiline
              minRows={2}
              data-testid="field-mgiu"
            />
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onCancel}
              confirmText={
                editedObject ? (
                  <TranslatedText
                    stringId="general.action.save"
                    fallback="Save"
                    data-testid="translatedtext-eru5"
                  />
                ) : (
                  <TranslatedText
                    stringId="general.action.add"
                    fallback="Add"
                    data-testid="translatedtext-wa8p"
                  />
                )
              }
              data-testid="formsubmitcancelrow-rz1i"
            />
          </NoteModalActionBlocker>
        </FormGrid>
      )}
      initialValues={getInitialValues()}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        diagnosisId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="general.diagnosis.label"
            fallback="Diagnosis"
            data-testid="translatedtext-9l7y"
          />,
        ),
        practitionerId: optionalForeignKey(),
        recordedDate: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.recordedDate.label"
              fallback="Date recorded"
              data-testid="translatedtext-3ish"
            />,
          ),
      })}
      data-testid="form-gxqz"
    />
  );
};

FamilyHistoryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

FamilyHistoryForm.defaultProps = {
  editedObject: null,
};
