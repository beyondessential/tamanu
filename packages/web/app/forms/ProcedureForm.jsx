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
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
  }) => (
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
                  label="Procedure"
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
                      stringId="general.localisedField.practitioner.label.short"
                      label="Practitioner"
                    />
                  }
                  required
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
                <Field
                  name="date"
                  label="Procedure date"
                  saveDateAsString
                  required
                  component={DateField}
                />
                <Field
                  locationGroupLabel="Procedure area"
                  label="Procedure location"
                  name="locationId"
                  enableLocationStatus={false}
                  required
                  component={LocationField}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="startTime"
                  label="Time started"
                  component={TimeField}
                  saveDateAsString
                />
                <Field name="endTime" label="Time ended" component={TimeField} saveDateAsString />
              </FormGrid>

              <Field
                name="anaesthetistId"
                label="Anaesthetist"
                component={AutocompleteField}
                suggester={practitionerSuggester}
              />
              <Field
                name="anaestheticId"
                label="Anaesthetic type"
                component={AutocompleteField}
                suggester={anaestheticSuggester}
                rows={4}
                style={{ gridColumn: 'span 2' }}
              />
              <Field
                name="assistantId"
                label="Assistant"
                component={AutocompleteField}
                suggester={practitionerSuggester}
              />
              <Field
                name="note"
                label="Notes or additional instructions"
                component={TextField}
                multiline
                rows={4}
                style={{ gridColumn: 'span 2' }}
              />
              <Field name="completed" label="Completed" component={CheckField} />
              <Collapse in={isCompleted} style={{ gridColumn: 'span 2' }}>
                <Field
                  name="completedNote"
                  label="Notes on completed procedure"
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
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        procedureTypeId: foreignKey('Procedure must be selected'),
        locationId: foreignKey('Location must be selected'),
        date: yup.date().required(),
        startTime: yup.date(),
        endTime: yup.date(),
        physicianId: foreignKey('Required'),
        assistantId: optionalForeignKey(),
        anaesthetistId: optionalForeignKey(),
        anaestheticId: optionalForeignKey(),
        note: yup.string(),
        completed: yup.boolean(),
        completedNote: yup.string(),
      })}
    />
  ),
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
