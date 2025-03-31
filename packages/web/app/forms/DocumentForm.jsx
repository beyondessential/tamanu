import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Typography } from '@material-ui/core';

import { ForbiddenError } from '@tamanu/shared/errors';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useApi, useSuggester } from '../api';
import { foreignKey } from '../utils/validation';
import { AutocompleteField, Field, Form, TextField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow, FormSubmitCancelRow } from '../components/ButtonRow';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

const MessageContainer = styled.div`
  margin: 0 auto;
  padding: 30px 0;
  max-width: 480px;
`;

const MessageTitle = styled(Typography)`
  font-weight: 500;
  font-size: 18px;
  line-height: 21px;
  margin-bottom: 10px;
  color: ${props => props.theme.palette.error.main};
`;

const Message = styled(Typography)`
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  font-size: 16px;
  line-height: 18px;
  margin-bottom: 30px;
`;

const ErrorMessageContents = ({ error, onCancel }) => (
  <div>
    <MessageContainer>
      <MessageTitle>
        <TranslatedText
          stringId="document.form.error.upload.title"
          fallback="Unable to upload file"
          data-testid='translatedtext-0l6u' />
      </MessageTitle>
      <Message>
        <TranslatedText
          stringId="document.form.error.upload.content"
          fallback="File cannot be uploaded at this time. This may be due to network problems or insufficient
          storage space on your server. Please try again in a few minutes or contact your system
          administrator."
          data-testid='translatedtext-t7kl' />
        <br />
        <TranslatedText
          stringId="document.form.error.messageDetails"
          fallback="Error message details:"
          data-testid='translatedtext-dmxp' />
        <br />
        {error}
      </Message>
    </MessageContainer>
    <ConfirmCancelRow cancelText="Close" onCancel={onCancel} />
  </div>
);

export const FILE_FILTERS = [
  { name: 'PDF (.pdf)', extensions: ['pdf'] },
  { name: 'JPEG (.jpeg - .jpg)', extensions: ['jpeg', 'jpg'] },
  // { name: 'Word (.doc - .docx)', extensions: ['doc', 'docx'] },
  // { name: 'Excel', extensions: ['xls', 'xlsx', 'xlsm'] },
];

const DocumentFormContents = ({ submitForm, departmentSuggester, onCancel }) => {
  return (
    <FormGrid>
      <Field
        component={FileChooserField}
        filters={FILE_FILTERS}
        label={<TranslatedText
          stringId="general.selectFile.label"
          fallback="Select file"
          data-testid='translatedtext-fcxb' />}
        name="file"
        required
        style={{ gridColumn: '1 / -1' }}
        data-testid='field-r7v3' />
      <Field
        name="name"
        label={<TranslatedText
          stringId="general.fileName.label"
          fallback="File name"
          data-testid='translatedtext-5ooo' />}
        required
        component={TextField}
        style={{ gridColumn: '1 / -1' }}
        data-testid='field-axjf' />
      <Field
        name="documentOwner"
        label={<TranslatedText
          stringId="document.documentOwner.label"
          fallback="Document owner"
          data-testid='translatedtext-4fih' />}
        component={TextField}
        data-testid='field-n8bq' />
      <Field
        name="departmentId"
        label={<TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-testid='translatedtext-e1hp' />}
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-testid='field-bydy' />
      <Field
        name="note"
        label={<TranslatedText
          stringId="general.note.label"
          fallback="Note"
          data-testid='translatedtext-zubx' />}
        component={TextField}
        style={{ gridColumn: '1 / -1' }}
        data-testid='field-95bo' />
      <FormSubmitCancelRow
        confirmText={<TranslatedText
          stringId="general.action.add"
          fallback="Add"
          data-testid='translatedtext-hf06' />}
        onConfirm={submitForm}
        onCancel={onCancel}
        data-testid='formsubmitcancelrow-pg9b' />
    </FormGrid>
  );
};

export const DocumentForm = ({ onStart, onSubmit, onError, onCancel, editedObject, endpoint }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [error, setError] = useState(false);

  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const handleSubmit = useCallback(
    async ({ file, ...data }) => {
      onStart();

      // Read file metadata
      const birthtime = new Date(file.lastModified);
      const attachmentType = file.type;

      try {
        await api.postWithFileUpload(endpoint, file, {
          ...data,
          type: attachmentType,
          documentCreatedAt: toDateTimeString(birthtime),
        });
      } catch (e) {
        onError(e);
        // Assume that if submission fails is because of lack of storage
        if (e instanceof ForbiddenError) {
          throw e; // allow error to be caught by error boundary
        } else {
          // eslint-disable-next-line no-console
          setError(e.message);
          return;
        }
      }

      onSubmit();
    },
    [api, endpoint, setError, onStart, onError, onSubmit],
  );

  const renderForm = ({ submitForm }) => {
    if (error) return <ErrorMessageContents error={error} onCancel={onCancel} />;
    return (
      <DocumentFormContents
        submitForm={submitForm}
        departmentSuggester={departmentSuggester}
        onCancel={onCancel}
      />
    );
  };

  return (
    <Form
      onSubmit={handleSubmit}
      render={renderForm}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={{
        date: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        file: yup
          .string()
          .required(
            getTranslation(
              'validation.required.file',
              'Please select a file to complete this request',
            ),
          ),
        name: foreignKey().translatedLabel(
          <TranslatedText
            stringId="document.validation.fileName.path"
            fallback="File name"
            data-testid='translatedtext-cr7s' />,
        ),
      })}
    />
  );
};
