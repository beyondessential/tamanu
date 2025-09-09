import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, ButtonRow, FormSubmitButton } from '@tamanu/ui-components';
import {
  Field,
  RadioField,
  TranslatedText,
} from '../../../components';
import { ReportSelectField, VersionSelectField } from './ReportsSelectFields';
import { notifySuccess, sanitizeFileName } from '../../../utils';
import { saveFile } from '../../../utils/fileSystemAccess';
import { useApi } from '../../../api/useApi';
import { useTranslation } from '../../../contexts/Translation';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const schema = yup.object().shape({
  reportId: yup
    .string()
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.export.report.label"
        fallback="Report"
        data-testid="translatedtext-28di"
      />,
    ),
  versionId: yup
    .string()
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.version.label"
        fallback="Version"
        data-testid="translatedtext-7jg8"
      />,
    ),
  format: yup
    .string()
    .oneOf(Object.values(REPORT_VERSION_EXPORT_FORMATS))
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.export.format.label"
        fallback="Format"
        data-testid="translatedtext-sumd"
      />,
    ),
});

export const ExportReportView = () => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [selectedReportName, setSelectedReportName] = useState(null);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);

  const handleSubmit = async ({ reportId, versionId, format }) => {
    try {
      const reportName =
        selectedReportName ?? getTranslation('admin.report.export.report.label', 'Report');
      const defaultFileName = sanitizeFileName(`${reportName}-v${selectedVersionNumber}.${format}`);

      const getData = async () => {
        const { data } = await api.get(
          `admin/reports/${reportId}/versions/${versionId}/export/${format}`,
        );
        return data;
      };

      await saveFile({
        defaultFileName,
        getData,
        extension: format,
      });
      notifySuccess(
        getTranslation('document.notification.downloadSuccess', 'Successfully downloaded file'),
      );
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.exportFailed"
          fallback={`Failed to export: ${err.message}`}
          replacements={{ message: err.message }}
          data-testid="translatedtext-w9jy"
        />,
      );
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
      render={({ values }) => (
        <InnerContainer data-testid="innercontainer-dvll">
          <FormGrid columns={1} data-testid="formgrid-7qjs">
            <Field
              component={ReportSelectField}
              required
              label={
                <TranslatedText
                  stringId="admin.report.export.report.label"
                  fallback="Report"
                  data-testid="translatedtext-d29c"
                />
              }
              name="reportId"
              placeholder={getTranslation(
                'admin.report.export.report.placeholder',
                'Select a report definition',
              )}
              setSelectedReportName={setSelectedReportName}
              data-testid="field-pehg"
            />
            {values.reportId && (
              <Field
                component={VersionSelectField}
                required
                label={
                  <TranslatedText
                    stringId="admin.report.export.version.label"
                    fallback="Version"
                    data-testid="translatedtext-svn2"
                  />
                }
                name="versionId"
                placeholder={getTranslation(
                  'admin.report.export.version.placeholder',
                  'Select a report version',
                )}
                setSelectedVersionNumber={setSelectedVersionNumber}
                data-testid="field-38mg"
              />
            )}
            {values.versionId && (
              <Field
                component={RadioField}
                label={
                  <TranslatedText
                    stringId="admin.report.export.format.label"
                    fallback="Format"
                    data-testid="translatedtext-ejl3"
                  />
                }
                name="format"
                options={Object.entries(REPORT_VERSION_EXPORT_FORMATS).map(([label, value]) => ({
                  label,
                  value,
                }))}
                data-testid="field-llhr"
              />
            )}
          </FormGrid>
          <ButtonRow alignment="left" data-testid="buttonrow-carm">
            <FormSubmitButton
              text={
                <TranslatedText
                  stringId="general.action.export"
                  fallback="Export"
                  data-testid="translatedtext-9ubx"
                />
              }
              data-testid="formsubmitbutton-j847"
            />
          </ButtonRow>
        </InnerContainer>
      )}
      data-testid="form-mimw"
    />
  );
};
