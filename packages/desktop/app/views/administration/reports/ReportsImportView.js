import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { useApi } from '../../../api';
import { Field, Form, FormGrid, Heading4, OutlinedButton, TextField } from '../../../components';
import { FileChooserField } from '../../../components/Field/FileChooserField';
import { useAuth } from '../../../contexts/Auth';
import { ReportSelectField } from './ReportSelectFields';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px;
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`;

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  file: yup.string().required('Report JSON is a required field'),
});

const parseFeedback = (name, { method, versionNumber, createdDefinition }) =>
  `${method === 'create' ? 'Created' : 'Updated'} version ${versionNumber} for ${
    createdDefinition ? 'newly created' : 'existing'
  } definition ${name}`;

const ImportForm = ({ isSubmitting, setFieldValue, values = {} }) => {
  const handleNameChange = event => {
    if (values.reportDefinitionId) {
      setFieldValue('reportDefinitionId', null);
    }
    setFieldValue('name', event.target.value);
  };
  return (
    <InnerContainer>
      <FormContainer columns={1}>
        <Field
          required
          label="Report Name"
          name="name"
          onChange={handleNameChange}
          component={TextField}
        />
        <Heading4>or</Heading4>
        <Field
          component={ReportSelectField}
          required
          label="Report"
          name="reportDefinitionId"
          includeNameChangeEvent
          placeholder="Select a report definition"
        />
      </FormContainer>
      <Field
        label="Report JSON"
        name="file"
        component={FileChooserField}
        filters={[{ name: 'JSON (.json)', extensions: ['json'] }]}
      />
      <StyledButton type="submit" isSubmitting={isSubmitting}>
        Import
      </StyledButton>
    </InnerContainer>
  );
};

export const ReportsImportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const handleSubmit = async payload => {
    try {
      const { reportDefinitionId, ...importValues } = payload;
      const feedback = await api.post('admin/reports/import', importValues);
      toast.success(parseFeedback(importValues.name, feedback));
      queryClient.invalidateQueries(['reportList']);
      if (payload.reportDefinitionId) {
        queryClient.invalidateQueries(['reportVersions', payload.reportDefinitionId]);
      }
    } catch (err) {
      toast.error(`Failed to import: ${err.message}`);
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      validationSchema={schema}
      initialValues={{
        userId: currentUser.id,
      }}
      showInlineErrorsOnly
      render={ImportForm}
    />
  );
};
