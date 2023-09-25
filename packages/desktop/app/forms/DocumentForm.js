import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { lookup as lookupMimeType } from 'mime-types';
import { Typography } from '@material-ui/core';

import { ForbiddenError } from '@tamanu/shared/errors';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../api';
import { useElectron } from '../contexts/Electron';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Form, Field, TextField, AutocompleteField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow, FormSubmitCancelRow } from '../components/ButtonRow';
import { ModalLoader } from '../components/BaseModal';

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
      <MessageTitle>Unable to upload file</MessageTitle>
      <Message>
        File cannot be uploaded at this time. This may be due to network problems or insufficient
        storage space on your server. Please try again in a few minutes or contact your system
        administrator.
        <br />
        Error message details:
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
      <FormSubmitCancelRow confirmText="Add" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );
};

export const DocumentForm = ({ onStart, onSubmit, onError, onCancel, editedObject, endpoint }) => {
  const api = useApi();
  const { getFileStatus } = useElectron();
  const [error, setError] = useState(false);

  const departmentSuggester = new Suggester(api, 'department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const handleSubmit = useCallback(
    async ({ file, ...data }) => {
      onStart();

      // Read and inject document creation date and type to metadata sent
      const { birthtime } = await getFileStatus(file);
      const attachmentType = lookupMimeType(file);

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
    [api, endpoint, getFileStatus, setError, onStart, onError, onSubmit],
  );

  const renderForm = ({ submitForm, isSubmitting }) => {
    if (isSubmitting) {
      return <ModalLoader loadingText="Please wait while we upload your document" />;
    }
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
