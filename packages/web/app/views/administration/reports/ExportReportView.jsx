import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import {
  ButtonRow,
  Field,
  Form,
  FormGrid,
  FormSubmitButton,
  RadioField,
  TranslatedText,
} from '../../../components';
import { ReportSelectField, VersionSelectField } from './ReportsSelectFields';
import { FORM_TYPES } from '../../../constants';
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
        data-test-id='translatedtext-xoqb' />,
    ),
  versionId: yup
    .string()
    .required()
    .translatedLabel(<TranslatedText
    stringId="admin.report.version.label"
    fallback="Version"
    data-test-id='translatedtext-uytp' />),
  format: yup
    .string()
    .oneOf(Object.values(REPORT_VERSION_EXPORT_FORMATS))
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.export.format.label"
        fallback="Format"
        data-test-id='translatedtext-en7w' />,
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
          data-test-id='translatedtext-4qji' />,
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
        <InnerContainer>
          <FormGrid columns={1}>
            <Field
              component={ReportSelectField}
              required
              label={
                <TranslatedText
                  stringId="admin.report.export.report.label"
                  fallback="Report"
                  data-test-id='translatedtext-imll' />
              }
              name="reportId"
              placeholder={getTranslation(
                'admin.report.export.report.placeholder',
                'Select a report definition',
              )}
              setSelectedReportName={setSelectedReportName}
              data-test-id='field-1zwt' />
            {values.reportId && (
              <Field
                component={VersionSelectField}
                required
                label={
                  <TranslatedText
                    stringId="admin.report.export.version.label"
                    fallback="Version"
                    data-test-id='translatedtext-hpgn' />
                }
                name="versionId"
                placeholder={getTranslation(
                  'admin.report.export.version.placeholder',
                  'Select a report version',
                )}
                setSelectedVersionNumber={setSelectedVersionNumber}
                data-test-id='field-q5s9' />
            )}
            {values.versionId && (
              <Field
                component={RadioField}
                label={
                  <TranslatedText
                    stringId="admin.report.export.format.label"
                    fallback="Format"
                    data-test-id='translatedtext-1ztl' />
                }
                name="format"
                options={Object.entries(REPORT_VERSION_EXPORT_FORMATS).map(([label, value]) => ({
                  label,
                  value,
                }))}
                data-test-id='field-1g15' />
            )}
          </FormGrid>
          <ButtonRow alignment="left" data-test-id='buttonrow-9n0o'>
            <FormSubmitButton
              text={<TranslatedText
                stringId="general.action.export"
                fallback="Export"
                data-test-id='translatedtext-qw0s' />}
              data-test-id='formsubmitbutton-5pc7' />
          </ButtonRow>
        </InnerContainer>
      )}
    />
  );
};
