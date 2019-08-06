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
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';

const suggesterType = PropTypes.shape({
  fetchSuggestions: PropTypes.func,
  fetchCurrentOption: PropTypes.func,
});

export class ProcedureForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),

    anesthesiaSuggester: suggesterType.isRequired,
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
    if(isCompleted) return 'Finalise';
    if(editedObject) return 'Update';
    return 'Create';
  }

  renderForm = ({ submitForm, values }) => {
    const {
      anesthesiaSuggester,
      cptCodeSuggester,
      locationSuggester,
      practitionerSuggester,
      editedObject,
    } = this.props;
    const isCompleted = !!values.completed;
    const buttonText = this.getButtonText(isCompleted);
    return (
      <FormGrid>
        <Field
          name="procedure"
          label="Procedure"
          required
          component={TextField}
        />
        <Field
          name="cptCode"
          label="CPT Code"
          component={AutocompleteField}
          suggester={cptCodeSuggester}
        />
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
          name="anesthesiologist"
          label="Anesthesiologist"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="anesthesiaType"
          label="Anesthesia Type"
          component={AutocompleteField}
          suggester={anesthesiaSuggester}
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
        <div style={{ gridColumn: 2, textAlign: 'right' }}>
          <Button variant="contained" onClick={this.onCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitForm} color="primary">
            {buttonText}
          </Button>
        </div>
      </FormGrid>
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
          procedure: yup.string().required(),
          cptCode: yup.string(),
          location: yup.string().required(),
          date: yup.string().required(),
          startTime: yup.string(),
          endTime: yup.string(),
          physician: yup.string().required(),
          assistant: yup.string(),
          anesthesiologist: yup.string(),
          anesthesiaType: yup.string(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNotes: yup.string(),
        })}
      />
    );
  }
}
