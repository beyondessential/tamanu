import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import {
  Form,
  Field,
  DateField,
  TimeField,
  CheckField,
  AutocompleteField,
  TextField,
  FormGroup,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';

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
    locationSuggester,
    practitionerSuggester,
  }) => (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm, values }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = isCompleted => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Create';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);
        return (
          <div>
            <FormGroup disabled={isCompleted}>
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
                    name="locationId"
                    label="Procedure location"
                    required
                    component={AutocompleteField}
                    suggester={locationSuggester}
                  />
                  <Field name="date" label="Procedure date" required component={DateField} />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field name="startTime" label="Time started" component={TimeField} />
                  <Field name="endTime" label="Time ended" component={TimeField} />
                </FormGrid>
                <Field
                  name="physicianId"
                  label="Physician"
                  required
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
                <Field
                  name="assistantId"
                  label="Assistant"
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
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
                  name="note"
                  label="Notes or additional instructions"
                  component={TextField}
                  multiline
                  rows={4}
                  style={{ gridColumn: 'span 2' }}
                />
              </FormGrid>
            </FormGroup>
            <FormGrid>
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
              <ConfirmCancelRow
                onCancel={handleCancel}
                onConfirm={submitForm}
                confirmText={buttonText}
              />
            </FormGrid>
          </div>
        );
      }}
      initialValues={{
        date: new Date(),
        startTime: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        procedureTypeId: foreignKey('Procedure must be selected'),
        locationId: foreignKey('Location must be selected'),
        date: yup.date().required(),
        startTime: yup.string(),
        endTime: yup.date(),
        physicianId: foreignKey('Physician must be selected'),
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
