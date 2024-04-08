import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import Collapse from '@material-ui/core/Collapse';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { foreignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const OngoingConditionForm = ({
  onSubmit,
  editedObject,
  onCancel,
  practitionerSuggester,
  icd10Suggester,
}) => {
  const RenderForm = ({ submitForm, values }) => {
    const resolving = values.resolved;
    const buttonText = editedObject ? (
      <TranslatedText stringId="general.action.save" fallback="Save" />
    ) : (
      <TranslatedText stringId="general.action.add" fallback="Add" />
    );
    return (
      <FormGrid columns={1}>
        <Field
          name="conditionId"
          label={
            <TranslatedText stringId="conditions.conditionName.label" fallback="Condition name" />
          }
          component={AutocompleteField}
          suggester={icd10Suggester}
          disabled={resolving}
          required
        />
        <Field
          name="recordedDate"
          label={<TranslatedText stringId="general.recordedDate.label" fallback="Date recorded" />}
          saveDateAsString
          component={DateField}
          disabled={resolving}
        />
        <Field
          name="examinerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
            />
          }
          disabled={resolving}
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="note"
          label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
          component={TextField}
          disabled={resolving}
        />
        <Field
          name="resolved"
          label={<TranslatedText stringId="conditions.resolved.label" fallback="Resolved" />}
          component={CheckField}
        />
        <Collapse in={resolving}>
          <FormGrid columns={1}>
            <Field
              name="resolutionDate"
              saveDateAsString
              label={
                <TranslatedText
                  stringId="conditions.resolutionDate.label"
                  fallback="Date resolved"
                />
              }
              component={DateField}
            />
            <Field
              name="resolutionPractitionerId"
              label={
                <TranslatedText
                  stringId="patient.ongoingCondition.resolutionPractitionerId.label"
                  fallback=":clinician confirming resolution"
                  replacements={{
                    clinician: (
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                      />
                    ),
                  }}
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="resolutionNote"
              label={
                <TranslatedText
                  stringId="conditions.resolutionNote.label"
                  fallback="Notes on resolution"
                />
              }
              component={TextField}
            />
          </FormGrid>
        </Collapse>
        <FormSubmitCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText={buttonText} />
      </FormGrid>
    );
  };

  const onDataSubmit = async data => {
    const fields = { ...data };

    if (!fields.resolved) {
      delete fields.resolutionDate;
      delete fields.resolutionNote;
      delete fields.resolutionPractitionerId;
    }

    await onSubmit(fields);
  };

  return (
    <Form
      onSubmit={onDataSubmit}
      render={RenderForm}
      initialValues={{
        recordedDate: getCurrentDateTimeString(),
        resolutionDate: getCurrentDateTimeString(),
        resolved: false,
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        conditionId: foreignKey('Condition is a required field'),
        recordedDate: yup.date(),
        examinerId: yup.string(),
        note: yup.string(),

        resolved: yup.boolean(),
        resolutionDate: yup.date(),
        resolutionPractitionerId: yup.string(),
        resolutionNote: yup.string(),
      })}
    />
  );
};

OngoingConditionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

OngoingConditionForm.defaultProps = {
  editedObject: null,
};
