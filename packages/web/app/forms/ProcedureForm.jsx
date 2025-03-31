import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  LocationField,
  TextField,
  TimeField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const suggesterType = PropTypes.shape({
  fetchSuggestions: PropTypes.func,
  fetchCurrentOption: PropTypes.func,
});

export const ProcedureForm = React.memo(
  ({
    onCancel,
    onSubmit,
    editedObject,
    anaestheticSuggester,
    procedureSuggester,
    practitionerSuggester,
  }) => {
    const { currentUser } = useAuth();

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel && onCancel();
          const getButtonText = isCompleted => {
            if (isCompleted)
              return (
                <TranslatedText
                  stringId="general.action.finalise"
                  fallback="Finalise"
                  data-testid='translatedtext-hgam' />
              );
            if (editedObject?.id)
              return (
                <TranslatedText
                  stringId="general.action.update"
                  fallback="Update"
                  data-testid='translatedtext-tbgv' />
              );
            return (
              <TranslatedText
                stringId="general.action.submit"
                fallback="Submit"
                data-testid='translatedtext-xsim' />
            );
          };

          const isCompleted = !!values.completed;
          const buttonText = getButtonText(isCompleted);
          return (
            <div>
              <FormGrid>
                <div style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="procedureTypeId"
                    label={
                      <TranslatedText
                        stringId="procedure.procedureType.label"
                        fallback="Procedure"
                        data-testid='translatedtext-y1oi' />
                    }
                    required
                    component={AutocompleteField}
                    suggester={procedureSuggester}
                    data-testid='field-xwcd' />
                </div>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="physicianId"
                    label={
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                        data-testid='translatedtext-2rh3' />
                    }
                    required
                    component={AutocompleteField}
                    suggester={practitionerSuggester}
                    data-testid='field-v4xs' />
                  <Field
                    name="date"
                    label={
                      <TranslatedText
                        stringId="procedure.date.label"
                        fallback="Procedure date"
                        data-testid='translatedtext-bjbr' />
                    }
                    saveDateAsString
                    required
                    component={DateField}
                    data-testid='field-9587' />
                  <Field
                    locationGroupLabel={
                      <TranslatedText
                        stringId="procedure.area.label"
                        fallback="Procedure area"
                        data-testid='translatedtext-bf5g' />
                    }
                    label={
                      <TranslatedText
                        stringId="procedure.location.label"
                        fallback="Procedure location"
                        data-testid='translatedtext-91qw' />
                    }
                    name="locationId"
                    enableLocationStatus={false}
                    required
                    component={LocationField}
                    data-testid='field-guc6' />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="startTime"
                    label={
                      <TranslatedText
                        stringId="procedure.startTime.label"
                        fallback="Time started"
                        data-testid='translatedtext-bccq' />
                    }
                    component={TimeField}
                    saveDateAsString
                    data-testid='field-7b5t' />
                  <Field
                    name="endTime"
                    label={
                      <TranslatedText
                        stringId="procedure.endTime.label"
                        fallback="Time ended"
                        data-testid='translatedtext-g9rq' />
                    }
                    component={TimeField}
                    saveDateAsString
                    data-testid='field-bjve' />
                </FormGrid>

                <Field
                  name="anaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetist.label"
                      fallback="Anaesthetist"
                      data-testid='translatedtext-6ev1' />
                  }
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                  data-testid='field-00ju' />
                <Field
                  name="anaestheticId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetic.label"
                      fallback="Anaesthetic type"
                      data-testid='translatedtext-hw5v' />
                  }
                  component={AutocompleteField}
                  suggester={anaestheticSuggester}
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                  data-testid='field-t28n' />
                <Field
                  name="assistantId"
                  label={
                    <TranslatedText
                      stringId="procedure.assistant.label"
                      fallback="Assistant"
                      data-testid='translatedtext-ifcr' />
                  }
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                  data-testid='field-72mr' />
                <Field
                  name="note"
                  label={
                    <TranslatedText
                      stringId="procedure.noteOrInstruction.label"
                      fallback="Notes or additional instructions"
                      data-testid='translatedtext-z7cf' />
                  }
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                  data-testid='field-erkr' />
                <Field
                  name="completed"
                  label={<TranslatedText
                    stringId="general.completed.label"
                    fallback="Completed"
                    data-testid='translatedtext-bmnz' />}
                  component={CheckField}
                  data-testid='field-9qms' />
                <Collapse in={isCompleted} style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="completedNote"
                    label={
                      <TranslatedText
                        stringId="procedure.completedNote.label"
                        fallback="Notes on completed procedure"
                        data-testid='translatedtext-v743' />
                    }
                    component={TextField}
                    multiline
                    minRows={4}
                    data-testid='field-p0kb' />
                </Collapse>
                <FormSubmitCancelRow
                  onCancel={handleCancel}
                  onConfirm={submitForm}
                  confirmText={buttonText}
                  data-testid='formsubmitcancelrow-2qzd' />
              </FormGrid>
            </div>
          );
        }}
        initialValues={{
          date: getCurrentDateTimeString(),
          startTime: getCurrentDateTimeString(),
          physicianId: currentUser.id,
          ...editedObject,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          procedureTypeId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="procedure.procedureType.label"
              fallback="Procedure"
              data-testid='translatedtext-eziy' />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.location.label"
              fallback="Location"
              data-testid='translatedtext-esk2' />,
          ),
          date: yup
            .date()
            .required()
            .translatedLabel(<TranslatedText
            stringId="general.date.label"
            fallback="Date"
            data-testid='translatedtext-4h76' />),
          startTime: yup
            .date()
            .translatedLabel(
              <TranslatedText
                stringId="general.startTime.label"
                fallback="Start time"
                data-testid='translatedtext-7woc' />,
            ),
          endTime: yup.date(),
          physicianId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid='translatedtext-6tzs' />,
          ),
          assistantId: optionalForeignKey(),
          anaesthetistId: optionalForeignKey(),
          anaestheticId: optionalForeignKey(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNote: yup.string(),
        })}
      />
    );
  },
);

ProcedureForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),

  anaestheticSuggester: suggesterType.isRequired,
  procedureSuggester: suggesterType.isRequired,
  locationSuggester: suggesterType.isRequired,
  practitionerSuggester: suggesterType.isRequired,
};

ProcedureForm.defaultProps = {
  editedObject: null,
};
