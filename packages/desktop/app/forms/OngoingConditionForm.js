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

import { foreignKey } from '../utils/validation';

export class OngoingConditionForm extends React.PureComponent {
  renderForm = ({ submitForm, values }) => {
    const { editedObject, onCancel, practitionerSuggester, icd10Suggester } = this.props;
    const resolving = values.resolved;
    const buttonText = editedObject ? 'Save' : 'Add';
    return (
      <FormGrid columns={1}>
        <Field
          name="conditionId"
          label="Condition name"
          component={AutocompleteField}
          suggester={icd10Suggester}
          disabled={resolving}
          required
        />
        <Field
          name="recordedDate"
          label="Date recorded"
          component={DateField}
          disabled={resolving}
        />
        <Field
          name="practitioner"
          label="Doctor/nurse"
          disabled={resolving}
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} disabled={resolving} />
        <Field name="resolved" label="Resolved" component={CheckField} />
        <Collapse in={resolving}>
          <FormGrid columns={1}>
            <Field name="resolutionDate" label="Date resolved" component={DateField} />
            <Field
              name="resolutionPractitioner"
              label="Doctor/nurse confirming resolution"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field name="resolutionNote" label="Notes on resolution" component={TextField} />
          </FormGrid>
        </Collapse>
        <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText={buttonText} />
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
          conditionId: foreignKey('Condition is a required field'),
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

OngoingConditionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

OngoingConditionForm.defaultProps = {
  editedObject: null,
};
