import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { AutocompleteField, DateField, Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const FamilyHistoryForm = ({
  onCancel,
  diagnosisSuggester,
  practitionerSuggester,
  editedObject,
  onSubmit,
}) => (
  <Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="diagnosisId"
          label={<TranslatedText
            stringId="general.diagnosis.label"
            fallback="Diagnosis"
            data-testid='translatedtext-p009' />}
          required
          component={AutocompleteField}
          suggester={diagnosisSuggester}
          data-testid='field-n5ak' />
        <Field
          name="recordedDate"
          label={<TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid='translatedtext-smw3' />}
          required
          component={DateField}
          saveDateAsString
          data-testid='field-1i4v' />
        <Field
          name="relationship"
          label={
            <TranslatedText
              stringId="familyHistory.relations.label"
              fallback="Relation to patient"
              data-testid='translatedtext-nxt8' />
          }
          component={TextField}
          data-testid='field-ub1e' />
        <Field
          name="practitionerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid='translatedtext-vux8' />
          }
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid='field-m9jg' />
        <Field
          name="note"
          label={<TranslatedText
            stringId="general.notes.label"
            fallback="Notes"
            data-testid='translatedtext-ksz0' />}
          component={TextField}
          multiline
          minRows={2}
          data-testid='field-5993' />
        <FormSubmitCancelRow
          onConfirm={submitForm}
          onCancel={onCancel}
          confirmText={
            editedObject ? (
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-testid='translatedtext-cv61' />
            ) : (
              <TranslatedText
                stringId="general.action.add"
                fallback="Add"
                data-testid='translatedtext-s0sc' />
            )
          }
          data-testid='formsubmitcancelrow-17xq' />
      </FormGrid>
    )}
    initialValues={{
      recordedDate: getCurrentDateTimeString(),
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      diagnosisId: foreignKey().translatedLabel(
        <TranslatedText
          stringId="general.diagnosis.label"
          fallback="Diagnosis"
          data-testid='translatedtext-n4rt' />,
      ),
      practitionerId: optionalForeignKey(),
      recordedDate: yup
        .date()
        .required()
        .translatedLabel(
          <TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid='translatedtext-ycth' />,
        ),
    })}
  />
);

FamilyHistoryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

FamilyHistoryForm.defaultProps = {
  editedObject: null,
};
