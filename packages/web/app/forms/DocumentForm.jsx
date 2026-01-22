import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Typography } from '@material-ui/core';

import { ForbiddenError } from '@tamanu/errors';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';

import { useApi, useSuggester } from '../api';
import { foreignKey } from '../utils/validation';
import {
  FileChooserField,
  TextField,
  Form,
  FormGrid,
  ConfirmCancelRow,
  FormSubmitCancelRow,
} from '@tamanu/ui-components';
import { AutocompleteField, Field } from '../components/Field';
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
    <MessageContainer data-testid="messagecontainer-p10q">
      <MessageTitle data-testid="messagetitle-7jrt">
        <TranslatedText
          stringId="document.form.error.upload.title"
          fallback="Unable to upload file"
          data-testid="translatedtext-j47t"
        />
      </MessageTitle>
      <Message data-testid="message-2hlf">
        <TranslatedText
          stringId="document.form.error.upload.content"
          fallback="File cannot be uploaded at this time. This may be due to network problems or insufficient
          storage space on your server. Please try again in a few minutes or contact your system
          administrator."
          data-testid="translatedtext-cdsj"
        />
        <br />
        <TranslatedText
          stringId="document.form.error.messageDetails"
          fallback="Error message details:"
          data-testid="translatedtext-1sf8"
        />
        <br />
        {error}
      </Message>
    </MessageContainer>
    <ConfirmCancelRow cancelText="Close" onCancel={onCancel} data-testid="confirmcancelrow-er6k" />
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
    <FormGrid data-testid="formgrid-tfve">
      <Field
        component={FileChooserField}
        filters={FILE_FILTERS}
        label={
          <TranslatedText
            stringId="general.selectFile.label"
            fallback="Select file"
            data-testid="translatedtext-pfld"
          />
        }
        name="file"
        required
        style={{ gridColumn: '1 / -1' }}
        data-testid="field-6tbq"
      />
      <Field
        name="name"
        label={
          <TranslatedText
            stringId="general.fileName.label"
            fallback="File name"
            data-testid="translatedtext-gqzg"
          />
        }
        required
        component={TextField}
        style={{ gridColumn: '1 / -1' }}
        data-testid="field-b9rq"
      />
      <Field
        name="documentOwner"
        label={
          <TranslatedText
            stringId="document.documentOwner.label"
            fallback="Document owner"
            data-testid="translatedtext-19ds"
          />
        }
        component={TextField}
        data-testid="field-yn8l"
      />
      <Field
        name="departmentId"
        label={
          <TranslatedText
            stringId="general.department.label"
            fallback="Department"
            data-testid="translatedtext-edoy"
          />
        }
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-testid="field-ynp5"
      />
      <Field
        name="note"
        label={
          <TranslatedText
            stringId="general.note.label"
            fallback="Note"
            data-testid="translatedtext-v5ak"
          />
        }
        component={TextField}
        style={{ gridColumn: '1 / -1' }}
        data-testid="field-sy66"
      />
      <FormSubmitCancelRow
        confirmText={
          <TranslatedText
            stringId="general.action.add"
            fallback="Add"
            data-testid="translatedtext-ujdq"
          />
        }
        onConfirm={submitForm}
        onCancel={onCancel}
        data-testid="formsubmitcancelrow-me5l"
      />
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
    if (error)
      return (
        <ErrorMessageContents
          error={error}
          onCancel={onCancel}
          data-testid="errormessagecontents-tam2"
        />
      );
    return (
      <DocumentFormContents
        submitForm={submitForm}
        departmentSuggester={departmentSuggester}
        onCancel={onCancel}
        data-testid="documentformcontents-nv5u"
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
            data-testid="translatedtext-zl9k"
          />,
        ),
      })}
      data-testid="form-pv2o"
    />
  );
};
