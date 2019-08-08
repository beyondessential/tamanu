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
    cptCodeSuggester: suggesterType.isRequired,
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
      cptCodeSuggester,
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
                name="cptCode"
                label="Procedure"
                required
                component={AutocompleteField}
                suggester={cptCodeSuggester}
              />
            </div>
            <Field
              name="location"
              label="Procedure Location"
              required
              component={AutocompleteField}
              suggester={locationSuggester}
            />
            <FormGrid columns={3}>
              <Field name="date" label="Procedure Date" required component={DateField} />
              <Field name="startTime" label="Time Started" component={TimeField} />
              <Field name="endTime" label="Time Ended" component={TimeField} />
            </FormGrid>
            <Field
              name="physician"
              label="Physician"
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="assistant"
              label="Assistant"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="anaesthetist"
              label="Anaesthetist"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="anaesthesiaType"
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
            style={{ gridColumn: 2 }}
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
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          cptCode: yup.string().required(),
          location: yup.string().required(),
          date: yup.string().required(),
          startTime: yup.string(),
          endTime: yup.string(),
          physician: yup.string().required(),
          assistant: yup.string(),
          anaesthetist: yup.string(),
          anaesthesiaType: yup.string(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNotes: yup.string(),
        })}
      />
    );
  }
}
