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
        data-testid="translatedtext-5jcb"
      />
    ) : (
      <TranslatedText
        stringId="general.action.add"
        fallback="Add"
        data-testid="translatedtext-rx6s"
      />
    );
    return (
      <FormGrid columns={1} data-testid="formgrid-lqds">
        <Field
          name="conditionId"
          label={
            <TranslatedText
              stringId="conditions.conditionName.label"
              fallback="Condition name"
              data-testid="translatedtext-avk1"
            />
          }
          component={AutocompleteField}
          suggester={diagnosisSuggester}
          disabled={resolving}
          required
          data-testid="field-j30y"
        />
        <Field
          name="recordedDate"
          label={
            <TranslatedText
              stringId="general.recordedDate.label"
              fallback="Date recorded"
              data-testid="translatedtext-hd0f"
            />
          }
          saveDateAsString
          component={DateField}
          disabled={resolving}
          data-testid="field-2775"
        />
        <Field
          name="examinerId"
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid="translatedtext-n0zg"
            />
          }
          disabled={resolving}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid="field-9miu"
        />
        <Field
          name="note"
          label={
            <TranslatedText
              stringId="general.notes.label"
              fallback="Notes"
              data-testid="translatedtext-f0ug"
            />
          }
          component={TextField}
          disabled={resolving}
          data-testid="field-e52k"
        />
        <Field
          name="resolved"
          label={
            <TranslatedText
              stringId="conditions.resolved.label"
              fallback="Resolved"
              data-testid="translatedtext-5d9a"
            />
          }
          component={CheckField}
          data-testid="field-c7nr"
        />
        <Collapse in={resolving} data-testid="collapse-pybu">
          <FormGrid columns={1} data-testid="formgrid-to6o">
            <Field
              name="resolutionDate"
              saveDateAsString
              label={
                <TranslatedText
                  stringId="conditions.resolutionDate.label"
                  fallback="Date resolved"
                  data-testid="translatedtext-q71w"
                />
              }
              component={DateField}
              data-testid="field-r84h"
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
                        data-testid="translatedtext-8kug"
                      />
                    ),
                  }}
                  data-testid="translatedtext-p0km"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-izs0"
            />
            <Field
              name="resolutionNote"
              label={
                <TranslatedText
                  stringId="conditions.resolutionNote.label"
                  fallback="Notes on resolution"
                  data-testid="translatedtext-qw5q"
                />
              }
              component={TextField}
              data-testid="field-4g2s"
            />
          </FormGrid>
        </Collapse>
        <FormSubmitCancelRow
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={buttonText}
          data-testid="formsubmitcancelrow-2r80"
        />
      </FormGrid>
    );
  };

  const onDataSubmit = async (data) => {
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
            data-testid="translatedtext-jhfb"
          />,
        ),
        recordedDate: yup.date(),
        examinerId: yup.string(),
        note: yup.string(),

        resolved: yup.boolean(),
        resolutionDate: yup.date(),
        resolutionPractitionerId: yup.string(),
        resolutionNote: yup.string(),
      })}
      data-testid="form-epwh"
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
