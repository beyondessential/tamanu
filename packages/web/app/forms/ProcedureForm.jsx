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
    physicianSuggester,
    anaesthetistSuggester,
    assistantSuggester,
  }) => {
    const { currentUser } = useAuth();

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel && onCancel();
          const getButtonText = isCompleted => {
            if (isCompleted)
              return <TranslatedText stringId="general.action.finalise" fallback="Finalise" />;
            if (editedObject?.id)
              return <TranslatedText stringId="general.action.update" fallback="Update" />;
            return <TranslatedText stringId="general.action.submit" fallback="Submit" />;
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
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={procedureSuggester}
                  />
                </div>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="physicianId"
                    label={
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={physicianSuggester}
                  />
                  <Field
                    name="date"
                    label={
                      <TranslatedText stringId="procedure.date.label" fallback="Procedure date" />
                    }
                    saveDateAsString
                    required
                    component={DateField}
                  />
                  <Field
                    locationGroupLabel={
                      <TranslatedText stringId="procedure.area.label" fallback="Procedure area" />
                    }
                    label={
                      <TranslatedText
                        stringId="procedure.location.label"
                        fallback="Procedure location"
                      />
                    }
                    name="locationId"
                    enableLocationStatus={false}
                    required
                    component={LocationField}
                  />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="startTime"
                    label={
                      <TranslatedText
                        stringId="procedure.startTime.label"
                        fallback="Time started"
                      />
                    }
                    component={TimeField}
                    saveDateAsString
                  />
                  <Field
                    name="endTime"
                    label={
                      <TranslatedText stringId="procedure.endTime.label" fallback="Time ended" />
                    }
                    component={TimeField}
                    saveDateAsString
                  />
                </FormGrid>

                <Field
                  name="anaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetist.label"
                      fallback="Anaesthetist"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaesthetistSuggester}
                />
                <Field
                  name="anaestheticId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetic.label"
                      fallback="Anaesthetic type"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaestheticSuggester}
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                <Field
                  name="assistantId"
                  label={
                    <TranslatedText stringId="procedure.assistant.label" fallback="Assistant" />
                  }
                  component={AutocompleteField}
                  suggester={assistantSuggester}
                />
                <Field
                  name="note"
                  label={
                    <TranslatedText
                      stringId="procedure.noteOrInstruction.label"
                      fallback="Notes or additional instructions"
                    />
                  }
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                <Field
                  name="completed"
                  label={<TranslatedText stringId="general.completed.label" fallback="Completed" />}
                  component={CheckField}
                />
                <Collapse in={isCompleted} style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="completedNote"
                    label={
                      <TranslatedText
                        stringId="procedure.completedNote.label"
                        fallback="Notes on completed procedure"
                      />
                    }
                    component={TextField}
                    multiline
                    minRows={4}
                  />
                </Collapse>
                <FormSubmitCancelRow
                  onCancel={handleCancel}
                  onConfirm={submitForm}
                  confirmText={buttonText}
                />
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
            <TranslatedText stringId="procedure.procedureType.label" fallback="Procedure" />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText stringId="general.location.label" fallback="Location" />,
          ),
          date: yup
            .date()
            .required()
            .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
          startTime: yup
            .date()
            .translatedLabel(
              <TranslatedText stringId="general.startTime.label" fallback="Start time" />,
            ),
          endTime: yup.date(),
          physicianId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />,
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
  physicianSuggester: suggesterType.isRequired,
  anaesthetistSuggester: suggesterType.isRequired,
  assistantSuggester: suggesterType.isRequired,
};

ProcedureForm.defaultProps = {
  editedObject: null,
};
