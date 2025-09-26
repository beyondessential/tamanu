import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import Alert from '@material-ui/lab/Alert/Alert';
import { FileChooserField, TextField, Form, OutlinedButton, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { useApi } from '../../../api';
import { BodyText, CheckField, Field, Heading4 } from '../../../components';
import { ReportSelectField } from './ReportsSelectFields';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
  margin-bottom: 20px;
`;

const StyledFileChooserField = styled(FileChooserField)`
  .MuiButton-outlinedPrimary {
    background: ${Colors.white};
  }
`;

const schema = yup.object().shape({
  name: yup
    .string()
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.import.reportName.label"
        fallback="Report name"
        data-testid="translatedtext-qv1k"
      />,
    ),
  file: yup
    .string()
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.import.reportJson.label"
        fallback="Report JSON"
        data-testid="translatedtext-4ogs"
      />,
    ),
});

const ImportFeedback = ({ feedback }) => (
  <Alert data-testid="alert-14l1">
    <Heading4 mb={1} data-testid="heading4-392p">
      {feedback.dryRun ? (
        <TranslatedText
          stringId="admin.report.import.dryRun.label"
          fallback="Dry run"
          data-testid="translatedtext-6re9"
        />
      ) : (
        <TranslatedText
          stringId="admin.report.import.feedback.success"
          fallback="Successfully imported"
          data-testid="translatedtext-vt25"
        />
      )}
    </Heading4>
    <BodyText mb={1} data-testid="bodytext-9xc7">
      {feedback.createdDefinition ? (
        <TranslatedText
          stringId="admin.report.import.feedback.createdNew"
          fallback="Created new"
          data-testid="translatedtext-h7if"
        />
      ) : (
        <TranslatedText
          stringId="admin.report.import.feedback.updatedExisting"
          fallback="Updated existing"
          data-testid="translatedtext-d1o7"
        />
      )}{' '}
      <TranslatedText
        stringId="admin.report.import.feedback.definition"
        fallback="Definition"
        data-testid="translatedtext-1che"
      />
      : <b>{feedback.name}</b>
    </BodyText>
    {feedback.reportDefinitionId && (
      <BodyText mb={1} data-testid="bodytext-oynz">
        <TranslatedText
          stringId="admin.report.import.feedback.reportId"
          fallback="Report id"
          data-testid="translatedtext-dpvg"
        />
        : <b>{feedback.reportDefinitionId}</b>
      </BodyText>
    )}
    <BodyText data-testid="bodytext-whbn">
      <TranslatedText
        stringId="admin.report.import.feedback.createdNewVersion"
        fallback="created new version"
        data-testid="translatedtext-rift"
      />
      : <b>{feedback.versionNumber}</b>
    </BodyText>
  </Alert>
);

const ImportForm = ({ isSubmitting, setFieldValue, feedback, values = {} }) => {
  const { getTranslation } = useTranslation();

  const handleNameChange = event => {
    if (values.reportDefinitionId) {
      setFieldValue('reportDefinitionId', null);
    }
    setFieldValue('name', event.target.value);
  };
  return (
    <InnerContainer data-testid="innercontainer-27q2">
      <FormContainer columns={1} data-testid="formcontainer-h6s4">
        <Field
          required
          label={
            <TranslatedText
              stringId="admin.report.reportName.label"
              fallback="Report name"
              data-testid="translatedtext-lagg"
            />
          }
          name="name"
          onChange={handleNameChange}
          component={TextField}
          data-testid="field-an6q"
        />
        <Heading4 data-testid="heading4-3g0g">or</Heading4>
        <Field
          component={ReportSelectField}
          required
          label={
            <TranslatedText
              stringId="admin.report.import.report.label"
              fallback="Report"
              data-testid="translatedtext-ki7p"
            />
          }
          name="reportDefinitionId"
          includeNameChangeEvent
          placeholder={getTranslation(
            'admin.report.import.report.placeholder',
            'Select a report definition',
          )}
          data-testid="field-x3rr"
        />
        <Field
          label={
            <TranslatedText
              stringId="admin.report.import.reportJson.label"
              fallback="Report JSON"
              data-testid="translatedtext-7gt6"
            />
          }
          name="file"
          component={StyledFileChooserField}
          filters={[{ name: 'JSON (.json)', extensions: ['json'] }]}
          data-testid="field-d8w1"
        />
        <Field
          label={
            <TranslatedText
              stringId="admin.report.import.dryRun.label"
              fallback="Dry run"
              data-testid="translatedtext-q9mm"
            />
          }
          name="dryRun"
          component={CheckField}
          data-testid="field-s0jf"
        />
      </FormContainer>
      <StyledButton type="submit" isSubmitting={isSubmitting} data-testid="styledbutton-zelz">
        <TranslatedText
          stringId="general.action.import"
          fallback="Import"
          data-testid="translatedtext-szec"
        />
      </StyledButton>
      {feedback && (
        <ImportFeedback
          name={values.name}
          dryRun={values.dryRun}
          feedback={feedback}
          data-testid="importfeedback-fnwu"
        />
      )}
    </InnerContainer>
  );
};

export const ImportReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async payload => {
    try {
      const { reportDefinitionId, file, ...importValues } = payload;
      setFeedback(null);
      const res = await api.postWithFileUpload('admin/reports/import', file, importValues);
      const { dryRun, name } = importValues;
      setFeedback({ ...res, name, dryRun });
      if (!dryRun) {
        queryClient.invalidateQueries(['reportList']);
        if (reportDefinitionId) {
          queryClient.invalidateQueries(['reportVersions', reportDefinitionId]);
        }
      }
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.importFailed"
          fallback={`Failed to import: ${err.message}`}
          replacements={{ message: err.message }}
          data-testid="translatedtext-4wwc"
        />,
      );
    }
  };

  return (
    <>
      <Form
        onSubmit={handleSubmit}
        validationSchema={schema}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          dryRun: true,
        }}
        showInlineErrorsOnly
        render={props => (
          <ImportForm {...props} feedback={feedback} data-testid="importform-4f8n" />
        )}
        data-testid="form-aryy"
      />
    </>
  );
};
