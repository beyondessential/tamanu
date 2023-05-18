import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import Alert from '@material-ui/lab/Alert/Alert';
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
import { ReportSelectField } from './ReportsSelectFields';
import { Colors } from '../../../constants';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
`;

const StyledFileChooserField = styled(FileChooserField)`
  .MuiButton-outlinedPrimary {
    background: ${Colors.white};
  }
`;

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  file: yup.string().required('Report JSON is a required field'),
});

const ImportFeedback = ({ name, feedback, dryRun }) => (
  <Alert>
    <Heading4 mb={1}>{dryRun ? 'Dry Run' : 'Successfully imported'}</Heading4>
    <BodyText mb={1}>
      {feedback.createdDefinition ? 'Created new' : 'Updated existing'} definition: <b>{name}</b>
    </BodyText>
    <BodyText>
      created new version: <b>{feedback.versionNumber}</b>
    </BodyText>
  </Alert>
);

const ImportForm = ({ isSubmitting, setFieldValue, feedback, values = {} }) => {
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
          component={StyledFileChooserField}
          filters={[{ name: 'JSON (.json)', extensions: ['json'] }]}
        />
        <Field label="Dry Run" name="dryRun" component={CheckField} />
      </FormContainer>
      <StyledButton type="submit" isSubmitting={isSubmitting}>
        Import
      </StyledButton>
      {feedback && <ImportFeedback name={values.name} dryRun={values.dryRun} feedback={feedback} />}
    </InnerContainer>
  );
};

export const ReportsImportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const { currentUser } = useAuth();

  const handleSubmit = async payload => {
    try {
      const { reportDefinitionId, ...importValues } = payload;
      setFeedback(null);
      const res = await api.post('admin/reports/import', importValues);
      setFeedback(res);
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
        render={props => <ImportForm {...props} feedback={feedback} />}
      />
    </>
  );
};
