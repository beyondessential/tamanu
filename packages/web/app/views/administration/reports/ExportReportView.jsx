import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { Field, Form, FormGrid, OutlinedButton, RadioField } from '../../../components';
import { ReportSelectField, VersionSelectField } from './ReportsSelectFields';
import { Colors, FORM_TYPES } from '../../../constants';
import { saveFile } from '../../../utils/fileSystemAccess';
import { useApi } from '../../../api/useApi';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px;
  background-color: ${Colors.white};
`;
const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const schema = yup.object().shape({
  reportId: yup.string().required('Report is a required field'),
  versionId: yup.string().required('Version is a required field'),
  format: yup
    .string()
    .oneOf(Object.values(REPORT_VERSION_EXPORT_FORMATS))
    .required('Format is a required field'),
});

export const ExportReportView = () => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  const handleSubmit = async ({ reportId, versionId, format }) => {
    try {
      const { filename, data } = await api.get(
        `admin/reports/${reportId}/versions/${versionId}/export/${format}`,
      );
      await saveFile({
        defaultFileName: filename,
        data,
        extensions: [format],
      });
    } catch (err) {
      toast.error(`Failed to export: ${err.message}`);
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      validationSchema={schema}
      initialValues={{
        format: REPORT_VERSION_EXPORT_FORMATS.JSON,
      }}
      formType={FORM_TYPES.CREATE_FORM}
      showInlineErrorsOnly
      render={({ values, isSubmitting }) => (
        <InnerContainer>
          <FormGrid columns={1}>
            <Field
              component={ReportSelectField}
              required
              label={<TranslatedText stringId="admin.report.export.report.label" fallback="Report" />}
              name="reportId"
              placeholder={getTranslation("general.placeholder.selectReportDefinition", "Select a report definition")}
            />
            {values.reportId && (
              <Field
                component={VersionSelectField}
                required
                label={<TranslatedText stringId="admin.report.export.version.label" fallback="Version" />}
                name="versionId"
                placeholder={getTranslation("general.placeholder.selectReportVersion", "Select a report version")}
            />
            )}
            {values.versionId && (
              <Field
                component={RadioField}
                label={<TranslatedText stringId="admin.report.export.format.label" fallback="Format" />}
                name="format"
                options={Object.entries(REPORT_VERSION_EXPORT_FORMATS).map(([label, value]) => ({
                  label,
                  value,
                }))}
              />
            )}
          </FormGrid>
          <StyledButton type="submit" isSubmitting={isSubmitting}>
            <TranslatedText stringId="general.action.export" fallback="Export" />
          </StyledButton>
        </InnerContainer>
      )}
    />
  );
};
