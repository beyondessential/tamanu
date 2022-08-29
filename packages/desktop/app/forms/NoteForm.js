import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
  TextField,
  SelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { noteTypes } from '../constants';

const selectableNoteTypes = noteTypes.filter(x => !x.hideFromDropdown);

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
`;

export class NoteForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { practitionerSuggester, onCancel, isReadOnly = false } = this.props;
    return (
      <>
        <StyledFormGrid columns={3}>
          <Field
            name="type"
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
          <Field name="date" label="Date & time" component={DateTimeField} disabled={isReadOnly} />
        </StyledFormGrid>

        <Field
          name="content"
          label="Add note"
          required
          component={TextField}
          multiline
          rows={6}
          disabled={isReadOnly}
        />
        {!isReadOnly && (
          <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
        )}
      </>
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
