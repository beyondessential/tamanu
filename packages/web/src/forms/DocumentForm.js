import React from 'react';
import * as yup from 'yup';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Form, Field, TextField, AutocompleteField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export const FILE_FILTERS = [
  { name: 'PDF (.pdf)', extensions: ['pdf'] },
  { name: 'JPEG (.jpeg - .jpg)', extensions: ['jpeg', 'jpg'] },
  // { name: 'Word (.doc - .docx)', extensions: ['doc', 'docx'] },
  // { name: 'Excel', extensions: ['xls', 'xlsx', 'xlsm'] },
];

export const DocumentForm = ({ actionText, onSubmit, onCancel, editedObject }) => {
  const api = useApi();
  const departmentSuggester = new Suggester(api, 'department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field
        component={FileChooserField}
        filters={FILE_FILTERS}
        label="Select file"
        name="file"
        required
        style={{ gridColumn: '1 / -1' }}
      />
      <Field
        name="name"
        label="File name"
        required
        component={TextField}
        style={{ gridColumn: '1 / -1' }}
      />
      <Field name="documentOwner" label="Document owner" component={TextField} />
      <Field
        name="departmentId"
        label="Department"
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <Field name="note" label="Note" component={TextField} style={{ gridColumn: '1 / -1' }} />
      <ConfirmCancelRow confirmText={actionText} onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        date: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        file: yup.string().required('Please select a file to complete this request'),
        name: foreignKey('File name is required'),
      })}
    />
  );
};
