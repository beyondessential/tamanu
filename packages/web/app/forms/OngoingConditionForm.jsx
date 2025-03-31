import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
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
  diagnosisSuggester,
}) => {
  const RenderForm = ({ submitForm, values }) => {
    const resolving = values.resolved;
    const buttonText = editedObject ? (
      <TranslatedText
        stringId="general.action.save"
        fallback="Save"
        data-testid='translatedtext-dqj6' />
    ) : (
      <TranslatedText
        stringId="general.action.add"
        fallback="Add"
        data-testid='translatedtext-7od5' />
    );
    return (
      <FormGrid columns={1}>
        <Field
          name="conditionId"
          label={
            <TranslatedText
              stringId="conditions.conditionName.label"
              fallback="Condition name"
              data-testid='translatedtext-ocd0' />
          }
          component={AutocompleteField}
          suggester={diagnosisSuggester}
          disabled={resolving}
          required
          data-testid='field-4cuv' />
        <Field
          name="recordedDate"
          label={<TranslatedText
            stringId="general.recordedDate.label"
            fallback="Date recorded"
            data-testid='translatedtext-txnl' />}
          saveDateAsString
          component={DateField}
          disabled={resolving}
          data-testid='field-bu7w' />
        <Field
          name="examinerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid='translatedtext-vzqo' />
          }
          disabled={resolving}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid='field-xrr7' />
        <Field
          name="note"
          label={<TranslatedText
            stringId="general.notes.label"
            fallback="Notes"
            data-testid='translatedtext-bn23' />}
          component={TextField}
          disabled={resolving}
          data-testid='field-wte7' />
        <Field
          name="resolved"
          label={<TranslatedText
            stringId="conditions.resolved.label"
            fallback="Resolved"
            data-testid='translatedtext-x4u3' />}
          component={CheckField}
          data-testid='field-iyud' />
        <Collapse in={resolving}>
          <FormGrid columns={1}>
            <Field
              name="resolutionDate"
              saveDateAsString
              label={
                <TranslatedText
                  stringId="conditions.resolutionDate.label"
                  fallback="Date resolved"
                  data-testid='translatedtext-i2ov' />
              }
              component={DateField}
              data-testid='field-q192' />
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
                        data-testid='translatedtext-xd65' />
                    ),
                  }}
                  data-testid='translatedtext-xllk' />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid='field-853c' />
            <Field
              name="resolutionNote"
              label={
                <TranslatedText
                  stringId="conditions.resolutionNote.label"
                  fallback="Notes on resolution"
                  data-testid='translatedtext-oymx' />
              }
              component={TextField}
              data-testid='field-esek' />
          </FormGrid>
        </Collapse>
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={buttonText}
          data-testid='formsubmitcancelrow-wbdg' />
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
        conditionId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="conditions.validation.conditionName.path"
            fallback="Condition"
            data-testid='translatedtext-ib0t' />,
        ),
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
