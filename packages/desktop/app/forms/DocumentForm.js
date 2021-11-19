import React from 'react';
import * as yup from 'yup';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';

import { Form, Field, TextField, AutocompleteField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';

export const FILE_FILTERS = [
  { name: 'Microsoft Excel files (.xlsx)', extensions: ['xlsx'] },
  { name: 'PDF (.pdf)', extensions: ['pdf'] },
  { name: 'Word (.doc)', extensions: ['doc'] },
  { name: 'JPEG (.jpeg)', extensions: ['jpeg'] },
];

export const DocumentForm = ({ actionText, onSubmit, onCancel, editedObject }) => {
  console.log('onSubmit', onSubmit);
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid>
          <Field
            component={FileChooserField}
            filters={[FILE_FILTERS]}
            label="Select file"
            name="file"
            required
          />
          <Field name="name" label="File name" required component={TextField} />
          <Field
            name="ownerId"
            label="Document owner"
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field name="department" label="Department" component={TextField} />
          <Field name="comment" label="Comment" component={TextField} />
          <ButtonRow>
            <Button variant="contained" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitForm} color="primary">
              {actionText}
            </Button>
          </ButtonRow>
        </FormGrid>
      )}
      initialValues={{
        date: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        name: foreignKey('File name is required'),
      })}
    />
  );
};
