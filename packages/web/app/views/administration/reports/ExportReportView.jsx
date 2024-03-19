import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { Field, Form, FormGrid, OutlinedButton, RadioField } from '../../../components';
import { useApi } from '../../../api';
import { ReportSelectField, VersionSelectField } from './ReportsSelectFields';
import { Colors } from '../../../constants';
import { saveFile } from '../../../utils/fileSystemAccess';

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px;
  background-color: ${Colors.white};
`;
const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;
const StyledLink = styled.span`
  cursor: pointer;
  text-decoration: underline;
`;

const schema = yup.object().shape({
  reportId: yup.string().required('Report is a required field'),
  versionId: yup.string().required('Version is a required field'),
  format: yup
    .string()
    .oneOf(Object.values(REPORT_VERSION_EXPORT_FORMATS))
    .required('Format is a required field'),
});

const SuccessMessage = ({ onClick, filePath }) => (
  <>
    Successfully exported to <StyledLink onClick={onClick}>{filePath}</StyledLink>
  </>
);

export const ExportReportView = () => {
  const api = useApi();

  const handleSubmit = async ({ reportId, versionId, format }) => {
    try {
      const { filename, data } = await api.get(
        `admin/reports/${reportId}/versions/${versionId}/export/${format}`,
      );
      await saveFile({
        defaultFileName: filename,
        data,
        extension: format,
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
      showInlineErrorsOnly
      render={({ values, isSubmitting }) => (
        <InnerContainer>
          <FormGrid columns={1}>
            <Field
              component={ReportSelectField}
              required
              label="Report"
              name="reportId"
              placeholder="Select a report definition"
            />
            {values.reportId && (
              <Field
                component={VersionSelectField}
                required
                label="Version"
                name="versionId"
                placeholder="Select a report version"
              />
            )}
            {values.versionId && (
              <Field
                component={RadioField}
                label="Format"
                name="format"
                options={Object.entries(REPORT_VERSION_EXPORT_FORMATS).map(([label, value]) => ({
                  label,
                  value,
                }))}
              />
            )}
          </FormGrid>
          <StyledButton type="submit" isSubmitting={isSubmitting}>
            Export
          </StyledButton>
        </InnerContainer>
      )}
    />
  );
};
