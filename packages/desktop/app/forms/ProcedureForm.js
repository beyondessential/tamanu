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

    anaesthesiaSuggester: suggesterType.isRequired,
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
      anaesthesiaSuggester,
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
                name="type.id"
                label="Procedure"
                required
                component={AutocompleteField}
                suggester={procedureSuggester}
              />
            </div>
            <Field
              name="location.id"
              label="Procedure location"
              required
              component={AutocompleteField}
              suggester={locationSuggester}
            />
            <FormGrid columns={3}>
              <Field name="date" label="Procedure date" required component={DateField} />
              <Field name="startTime" label="Time started" component={TimeField} />
              <Field name="endTime" label="Time ended" component={TimeField} />
            </FormGrid>
            <Field
              name="physician.id"
              label="Physician"
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="assistant.id"
              label="Assistant"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="anaesthetist.id"
              label="Anaesthetist"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="anaesthesiaType.id"
              label="Anaesthesia Type"
              component={AutocompleteField}
              suggester={anaesthesiaSuggester}
              rows={4}
              style={{ gridColumn: 'span 2' }}
            />
            <Field
              name="notes"
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
              name="completedNotes"
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
          type: foreignKey("Procedure must be selected"),
          location: foreignKey("Location must be selected"),
          date: yup.date().required(),
          startTime: yup.date(),
          endTime: yup.date(),
          physician: foreignKey("Physician must be selected"),
          assistant: optionalForeignKey(),
          anaesthetist: optionalForeignKey(),
          anaesthesiaType: optionalForeignKey(),
          notes: yup.string(),
          completed: yup.boolean(),
          completedNotes: yup.string(),
        })}
      />
    );
  }
}
