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
  renderForm = ({ submitForm }) => {
    const { practitionerSuggester, onCancel, isReadOnly = false } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="noteType"
          label="Type"
          required
          component={SelectField}
          options={selectableNoteTypes}
          disabled={isReadOnly}
        />
        <Field
          name="authorId"
          label="Written by (or on behalf of)"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          disabled={isReadOnly}
        />
        <Field name="priority" label="Priority" component={CheckField} disabled={isReadOnly} />
        <Field
          name="content"
          label="Note"
          required
          component={TextField}
          multiline
          rows={6}
          disabled={isReadOnly}
        />
        <Field name="date" label="Date & time" component={DateTimeField} disabled={isReadOnly} />
        {!isReadOnly && (
          <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
        )}
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

NoteForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
