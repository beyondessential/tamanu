import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
  TextField,
  CheckField,
  SelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { noteTypes } from '../constants';

const selectableNoteTypes = noteTypes.filter(x => !x.hideFromDropdown);

export class NoteForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { practitionerSuggester, onCancel } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="noteType"
          label="Type"
          required
          component={SelectField}
          options={selectableNoteTypes}
        />
        <Field
          name="authorId"
          label="Written by (or on behalf of)"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="priority" label="Priority" component={CheckField} />
        <Field name="content" label="Note" required component={TextField} multiline rows={6} />
        <Field name="date" label="Date & time" component={DateTimeField} />
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { editedObject, onSubmit } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          authorId: foreignKey('Author is required'),
        })}
      />
    );
  }
}
