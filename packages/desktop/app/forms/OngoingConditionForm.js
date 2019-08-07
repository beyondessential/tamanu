import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  CheckField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export class OngoingConditionForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),
  };

  static defaultProps = {
    editedObject: null,
  };

  renderForm = ({ submitForm, values }) => {
    const { editedObject, onCancel, practitionerSuggester } = this.props;
    const resolving = values.resolved;
    const buttonText = editedObject ? 'Save' : 'Create';
    return (
      <FormGrid>
        <Field
          name="name"
          label="Condition name"
          component={TextField}
          required
          style={{ gridColumn: 'span 2' }}
        />
        <Field name="date" label="Date recorded" component={DateField} />
        <Field
          name="practitioner"
          label="Doctor/Nurse"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} style={{ gridColumn: 'span 2' }} />
        <Field name="resolved" label="Resolved" component={CheckField} />
        <Collapse in={resolving} style={{ gridColumn: 'span 2' }}>
          <FormGrid>
            <Field name="resolutionDate" label="Date resolved" component={DateField} />
            <Field
              name="resolutionPractitioner"
              label="Doctor/Nurse confirming resolution"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="resolutionNote"
              label="Notes on resolution"
              component={TextField}
              style={{ gridColumn: 'span 2' }}
            />
          </FormGrid>
        </Collapse>
        <ConfirmCancelRow
          style={{ gridColumn: 2 }}
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText={buttonText}
        />
      </FormGrid>
    );
  };

  onSubmit = data => {
    const { onSubmit } = this.props;
    if (data.resolved) {
      onSubmit(data);
      return;
    }

    // remove resolution-specific fields if not resolved
    const { resolutionDate, resolutionNote, resolutionPractitioner, ...rest } = data;
    onSubmit(rest);
  };

  render() {
    const { editedObject } = this.props;
    return (
      <Form
        onSubmit={this.onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          resolutionDate: new Date(),
          resolved: false,
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          name: yup.string().required(),
          date: yup.date(),
          practitioner: yup.string(),
          note: yup.string(),

          resolved: yup.boolean(),
          resolutionDate: yup.string(),
          resolutionPractitioner: yup.string(),
          resolutionNote: yup.string(),
        })}
      />
    );
  }
}
