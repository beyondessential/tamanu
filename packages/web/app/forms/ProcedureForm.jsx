import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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
import { useLocalisedText } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { FORM_TYPES } from '../constants';

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
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

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
                        stringId="procedure.form.procedureType.label"
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
                    label={clinicianText}
                    required
                    component={AutocompleteField}
                    suggester={practitionerSuggester}
                  />
                  <Field
                    name="date"
                    label={
                      <TranslatedText
                        stringId="procedure.form.date.label"
                        fallback="Procedure date"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateField}
                  />
                  <Field
                    locationGroupLabel={
                      <TranslatedText
                        stringId="procedure.form.area.label"
                        fallback="Procedure area"
                      />
                    }
                    label={
                      <TranslatedText
                        stringId="procedure.form.location.label"
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
                        stringId="procedure.form.startTime.label"
                        fallback="Time started"
                      />
                    }
                    component={TimeField}
                    saveDateAsString
                  />
                  <Field
                    name="endTime"
                    label={
                      <TranslatedText
                        stringId="procedure.form.endTime.label"
                        fallback="Time ended"
                      />
                    }
                    component={TimeField}
                    saveDateAsString
                  />
                </FormGrid>

                <Field
                  name="anaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.form.aneasthetist.label"
                      fallback="Anaesthetist"
                    />
                  }
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
                <Field
                  name="anaestheticId"
                  label={
                    <TranslatedText
                      stringId="procedure.form.anaesthetic.label"
                      fallback="Anaesthetic type"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaestheticSuggester}
                  rows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                <Field
                  name="assistantId"
                  label={
                    <TranslatedText
                      stringId="procedure.form.assistant.label"
                      fallback="Assistant"
                    />
                  }
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
                <Field
                  name="note"
                  label={
                    <TranslatedText
                      stringId="procedure.form.note.label"
                      fallback="Notes or additional instructions"
                    />
                  }
                  component={TextField}
                  multiline
                  rows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                <Field
                  name="completed"
                  label={
                    <TranslatedText
                      stringId="procedure.form.completed.label"
                      fallback="Completed"
                    />
                  }
                  component={CheckField}
                />
                <Collapse in={isCompleted} style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="completedNote"
                    label={
                      <TranslatedText
                        stringId="procedure.form.completedNote.label"
                        fallback="Notes on completed procedure"
                      />
                    }
                    component={TextField}
                    multiline
                    rows={4}
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
          ...editedObject,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_DATA_FORM : FORM_TYPES.CREATE_DATA_FORM}
        validationSchema={yup.object().shape({
          procedureTypeId: foreignKey('Procedure must be selected'),
          locationId: foreignKey('Location must be selected'),
          date: yup.date().required(),
          startTime: yup.date(),
          endTime: yup.date(),
          physicianId: foreignKey(`${clinicianText} must be selected`),
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
