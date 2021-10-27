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

export class ProcedureForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),

    anaestheticSuggester: suggesterType.isRequired,
    procedureSuggester: suggesterType.isRequired,
    locationSuggester: suggesterType.isRequired,
    practitionerSuggester: suggesterType.isRequired,
  };

  static defaultProps = {
    editedObject: null,
  };

  onCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) onCancel();
  };

  getButtonText(isCompleted) {
    const { editedObject } = this.props;
    if (isCompleted) return 'Finalise';
    if (editedObject) return 'Update';
    return 'Create';
  }

  renderForm = ({ submitForm, values }) => {
    const {
      anaestheticSuggester,
      procedureSuggester,
      locationSuggester,
      practitionerSuggester,
    } = this.props;
    const isCompleted = !!values.completed;
    const buttonText = this.getButtonText(isCompleted);
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
              name="anaestheticTypeId"
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
            onCancel={this.onCancel}
            onConfirm={submitForm}
            confirmText={buttonText}
          />
        </FormGrid>
      </div>
    );
  };

  render() {
    const { onSubmit, editedObject } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          startTime: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          procedureTypeId: foreignKey('Procedure must be selected'),
          locationId: foreignKey('Location must be selected'),
          date: yup.date().required(),
          startTime: yup.date(),
          endTime: yup.date(),
          physicianId: foreignKey('Physician must be selected'),
          assistantId: optionalForeignKey(),
          anaesthetistId: optionalForeignKey(),
          anaestheticTypeId: optionalForeignKey(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNote: yup.string(),
        })}
      />
    );
  }
}
