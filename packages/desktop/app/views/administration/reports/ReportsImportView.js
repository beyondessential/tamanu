import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import CheckIcon from '@material-ui/icons/CheckCircleOutlined';
import { Box } from '@material-ui/core';
import { useApi } from '../../../api';
import {
  BodyText,
  CheckField,
  Field,
  Form,
  FormGrid,
  Heading4,
  OutlinedButton,
  TextField,
} from '../../../components';
import { FileChooserField } from '../../../components/Field/FileChooserField';
import { useAuth } from '../../../contexts/Auth';
import { ReportSelectField } from './ReportSelectFields';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`;

const FeedbackContainer = styled.div`
  border-radius: 6px;
  padding: 20px;
  background: #edf7ed;
  color: #1e4620;
`;

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  file: yup.string().required('Report JSON is a required field'),
});

const ImportFeedback = ({ name, feedback, dryRun }) => {
  return (
    <FeedbackContainer>
      <Box display="flex" alignItems="center" mb={2}>
        <CheckIcon style={{ marginRight: 6 }} />
        <Heading4>{dryRun ? 'Dry Run' : 'Succesfully imported'}</Heading4>
      </Box>
      <BodyText mb={1}>
        {feedback.createdDefinition ? 'Created new' : 'Updated existing'} definition: <b>{name}</b>
      </BodyText>
      <BodyText>
        {feedback.method ? 'Created new' : 'Updated existing'} version:{' '}
        <b>{feedback.versionNumber}</b>
      </BodyText>
    </FeedbackContainer>
  );
};

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
        <Field
          label="Report JSON"
          name="file"
          component={FileChooserField}
          filters={[{ name: 'JSON (.json)', extensions: ['json'] }]}
        />
        <Field label="Dry Run" name="dryRun" component={CheckField} />
        <OutlinedButton type="submit" isSubmitting={isSubmitting}>
          Import
        </OutlinedButton>
      </FormContainer>
      {values.feedback && (
        <ImportFeedback name={values.name} feedback={values.feedback} dryRun={values.dryRun} />
      )}
    </InnerContainer>
  );
};

export const ReportsImportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const handleSubmit = async (payload, { setFieldValue }) => {
    try {
      const { reportDefinitionId, feedback, ...importValues } = payload;
      setFieldValue('feedback', null);
      const res = await api.post('admin/reports/import', importValues);
      setFieldValue('feedback', res);
      if (!payload.dryRun) {
        queryClient.invalidateQueries(['reportList']);
        if (payload.reportDefinitionId) {
          queryClient.invalidateQueries(['reportVersions', payload.reportDefinitionId]);
        }
      }
    } catch (err) {
      toast.error(`Failed to import: ${err.message}`);
    }
  };

  return (
    <>
      <Form
        onSubmit={handleSubmit}
        validationSchema={schema}
        initialValues={{
          userId: currentUser.id,
          dryRun: true,
        }}
        showInlineErrorsOnly
        render={ImportForm}
      />
    </>
  );
};
