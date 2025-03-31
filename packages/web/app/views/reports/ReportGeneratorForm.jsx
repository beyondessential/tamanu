import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { keyBy, orderBy } from 'lodash';
import { format } from 'date-fns';
import { Box, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import GetAppIcon from '@material-ui/icons/GetApp';
import styled from 'styled-components';
import * as Yup from 'yup';
import {
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATA_SOURCES,
  REPORT_EXPORT_FORMATS,
} from '@tamanu/constants';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import {
  AutocompleteField,
  Button,
  DateDisplay,
  DateField,
  Field,
  Form,
  FormGrid,
  getReferenceDataStringId,
  RadioField,
  TextButton,
} from '../../components';
import { FormSubmitDropdownButton } from '../../components/DropdownButton';
import { Colors, FORM_TYPES } from '../../constants';
import { prepareExcelFile } from '../../utils/saveExcelFile';
import { saveFile } from '../../utils/fileSystemAccess';
import { EmailField, parseEmails } from './EmailField';
import { ParameterField } from './ParameterField';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation';
import { ReportAboutModal } from './ReportAboutModal';
import { useTranslation } from '../../contexts/Translation';

const Spacer = styled.div`
  padding-top: 30px;
`;

const DateRangeLabel = styled(Typography)`
  font-weight: 500;
  margin-bottom: 5px;
  padding-top: 30px;
  color: ${Colors.darkText};
`;

const EmailInputContainer = styled.div`
  margin-bottom: 30px;
  width: 60%;
`;

const AboutReportButton = styled(TextButton)`
  text-decoration: underline;
  font-size: 15px;
  justify-content: start;
  font-weight: normal;
  color: ${Colors.darkText};
  width: fit-content;
  text-transform: none;

  :hover {
    font-weight: 500;
    color: ${Colors.primary};
    cursor: pointer;
    text-decoration: underline;
  }
`;

// adding an onValueChange hook to the report id field
// so we can keep internal state of the report id
const ReportIdField = ({ onValueChange, ...props }) => {
  const { field } = props;
  const changeCallback = useCallback(
    event => {
      onValueChange(event.target.value);
      field.onChange(event);
    },
    [onValueChange, field],
  );
  return <AutocompleteField {...props} onChange={changeCallback} data-testid='autocompletefield-djqw' />;
};

const buildParameterFieldValidation = ({ name, required }) => {
  if (required) return Yup.mixed().required(`${name} is a required field`);

  return Yup.mixed();
};

const useFileName = () => {
  const { getLocalisation } = useLocalisation();
  const country = getLocalisation('country');
  const date = format(new Date(), 'ddMMyyyy');
  const { getTranslation } = useTranslation();

  const countryName = getTranslation(getReferenceDataStringId(country.id, 'country'), country.name);

  return reportName => {
    const dashedName = `${reportName}-${countryName}`
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `report-${date}-${dashedName}`;
  };
};

const getAboutReportString = reportName => `About ${reportName}`;

const isJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const ReportGeneratorForm = () => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const getFileName = useFileName();
  const { currentUser, facilityId } = useAuth();
  const [successMessage, setSuccessMessage] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [bookType, setBookFormat] = useState(REPORT_EXPORT_FORMATS.XLSX);
  const [availableReports, setAvailableReports] = useState([]);
  const [dataSource, setDataSource] = useState(REPORT_DATA_SOURCES.THIS_FACILITY);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dataReadyForSaving, setDataReadyForSaving] = useState(null);

  const reportsById = useMemo(() => keyBy(availableReports, 'id'), [availableReports]);
  const reportOptions = useMemo(
    () =>
      orderBy(
        availableReports.map(r => ({ value: r.id, label: r.name })),
        'label',
      ),
    [availableReports],
  );

  const {
    parameters = [],
    dateRangeLabel = (
      <TranslatedText
        stringId="report.generate.dateRange.label"
        fallback="Date range"
        data-testid='translatedtext-qv7t' />
    ),
    dataSourceOptions = REPORT_DATA_SOURCE_VALUES,
    filterDateRangeAsStrings = true,
  } = reportsById[selectedReportId] || {};

  const isDataSourceFieldDisabled = dataSourceOptions.length === 1;

  useEffect(() => {
    if (!dataSourceOptions.includes(dataSource)) {
      setDataSource(dataSourceOptions[0]);
    }
  }, [dataSourceOptions, dataSource]);

  useEffect(() => {
    (async () => {
      try {
        const reports = await api.get('reports');
        setAvailableReports(reports);
      } catch (error) {
        setRequestError(
          `${(
            <TranslatedText
              stringId="report.generate.requestError.loadFailure"
              fallback="Unable to load available reports"
              data-testid='translatedtext-y5jf' />
          )} - ${error.message}`,
        );
      }
    })();
  }, [api]);

  const submitRequestReport = async formValues => {
    const { reportId, ...filterValues } = formValues;
    delete filterValues.emails;

    const updatedFilters = Object.fromEntries(
      Object.entries(filterValues).map(([key, value]) => {
        if (isJsonString(value)) {
          return [key, JSON.parse(value)];
        }
        return [key, value];
      }),
    );

    try {
      if (dataSource === REPORT_DATA_SOURCES.THIS_FACILITY) {
        const excelData = await api.post(`reports/${reportId}`, {
          parameters: updatedFilters,
          facilityId,
        });

        const filterString = Object.entries(filterValues)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        const reportName = reportsById[reportId].name;

        const date = DateDisplay.stringFormat(new Date());

        const metadata = [
          ['Report Name:', reportName],
          ['Date Generated:', date],
          ['User:', currentUser.email],
          ['Filters:', filterString],
        ];

        setDataReadyForSaving(
          prepareExcelFile({
            data: excelData,
            metadata,
            defaultFileName: getFileName(reportName),
            bookType,
          }),
        );
      } else {
        await api.post(`reportRequest`, {
          reportId,
          parameters: updatedFilters,
          emailList: parseEmails(formValues.emails),
          bookType,
        });
        setSuccessMessage(
          <TranslatedText
            stringId="report.generate.message.request.success"
            fallback="Report successfully requested. You will receive an email soon."
            data-testid='translatedtext-ah0h' />,
        );
      }
    } catch (e) {
      setRequestError(
        <TranslatedText
          stringId="reportGenerator.error.cantSubmitRequest"
          fallback="Unable to submit report request - :errorMessage"
          replacements={{ errorMessage: e.message }}
          data-testid='translatedtext-6gat' />,
      );
    }
  };

  const resetDownload = () => {
    setRequestError(null);
    setSuccessMessage(null);
    setDataReadyForSaving(null);
  };

  const onDownload = async () => {
    try {
      await saveFile(dataReadyForSaving);
      resetDownload();
      setSuccessMessage(
        <TranslatedText
          stringId="report.generate.message.export.success"
          fallback="Report successfully exported"
          data-testid='translatedtext-6kh9' />,
      );
    } catch (error) {
      setRequestError(`Unable to export report - ${error.message}`);
    }
  };

  // Wait until available reports are loaded to render.
  // This is a workaround because of an issue that the onChange callback (when selecting a report)
  // inside render method of Formik doesn't update its dependency when the available reports list is already loaded
  if (Array.isArray(availableReports) === false && !requestError) {
    return <LoadingIndicator backgroundColor="#f7f9fb" />;
  }

  return (
    <Form
      initialValues={{
        reportId: '',
        emails: currentUser.email,
      }}
      formType={FORM_TYPES.CREATE_FORM}
      onSubmit={submitRequestReport}
      validationSchema={Yup.object().shape({
        reportId: Yup.string().required(
          getTranslation(
            'validation.rule.mustSelectReport',
            "Report id is required. A report must be selected from the dropdown; just entering a report name will not work. If you can't see a specific report, please contact your system administrator.",
          ),
        ),
        ...parameters.reduce(
          (schema, field) => ({
            ...schema,
            [field.name]: buildParameterFieldValidation(field),
          }),
          {},
        ),
      })}
      render={({ values, submitForm, clearForm }) => (
        <>
          <FormGrid columns={2}>
            <Field
              name="reportId"
              label={<TranslatedText
                stringId="report.generate.report.label"
                fallback="Report"
                data-testid='translatedtext-fvf0' />}
              component={ReportIdField}
              options={reportOptions}
              required
              onValueChange={reportId => {
                setSelectedReportId(reportId);
                clearForm();
                resetDownload();
              }}
              data-testid='field-rn03' />
            <Field
              name="dataSource"
              label=" "
              value={dataSource}
              onChange={e => {
                setDataSource(e.target.value);
                resetDownload();
              }}
              options={[
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.dataSource.option.thisFacility"
                      fallback="This facility"
                      data-testid='translatedtext-1d1g' />
                  ),
                  value: REPORT_DATA_SOURCES.THIS_FACILITY,
                },
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.dataSource.option.allFacilities"
                      fallback="All facilities"
                      data-testid='translatedtext-k9wt' />
                  ),
                  value: REPORT_DATA_SOURCES.ALL_FACILITIES,
                },
              ]}
              component={RadioField}
              disabled={isDataSourceFieldDisabled}
              data-testid='field-4le9' />
          </FormGrid>
          {reportsById[selectedReportId]?.notes && (
            <>
              <FormGrid columns={1}>
                <AboutReportButton onClick={() => setIsReportModalOpen(true)}>
                  {getAboutReportString(reportsById[selectedReportId].name)}
                </AboutReportButton>
              </FormGrid>
              <ReportAboutModal
                title={getAboutReportString(reportsById[selectedReportId].name)}
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                content={reportsById[selectedReportId].notes}
              />
            </>
          )}
          {parameters.length > 0 ? (
            <>
              <Spacer />
              <FormGrid columns={3}>
                {parameters.map(({ parameterField, required, name, label, ...restOfProps }) => {
                  return (
                    <ParameterField
                      key={name || parameterField}
                      required={required}
                      name={name}
                      label={label}
                      parameterValues={values}
                      parameterField={parameterField}
                      parameters={parameters}
                      onChange={() => resetDownload()}
                      {...restOfProps}
                    />
                  );
                })}
              </FormGrid>
            </>
          ) : null}
          <DateRangeLabel variant="body1">{dateRangeLabel}</DateRangeLabel>
          <FormGrid columns={2} style={{ marginBottom: 30 }}>
            <Field
              name="fromDate"
              label={
                <TranslatedText
                  stringId="report.generate.fromDate.label"
                  fallback="From date"
                  data-testid='translatedtext-2m13' />
              }
              onChange={() => resetDownload()}
              component={DateField}
              saveDateAsString={filterDateRangeAsStrings}
              data-testid='field-iij2' />
            <Field
              name="toDate"
              label={<TranslatedText
                stringId="report.generate.toDate.label"
                fallback="To date"
                data-testid='translatedtext-rr3l' />}
              onChange={() => resetDownload()}
              component={DateField}
              saveDateAsString={filterDateRangeAsStrings}
              data-testid='field-znhm' />
          </FormGrid>
          {dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES && (
            <EmailInputContainer>
              <EmailField onChange={() => resetDownload()} />
            </EmailInputContainer>
          )}
          {requestError && (
            <Alert
              severity="error"
              style={{ marginBottom: 20 }}
              onClose={() => {
                setRequestError(null);
              }}
            >
              Error: {requestError}
            </Alert>
          )}
          {successMessage && (
            <Alert
              severity="success"
              style={{ marginBottom: 20 }}
              onClose={() => {
                setSuccessMessage(null);
              }}
            >
              <AlertTitle>Success</AlertTitle>
              {successMessage}
            </Alert>
          )}
          <Box display="flex" justifyContent="flex-end" gridGap="1em">
            {dataReadyForSaving ? (
              <Button onClick={onDownload} startIcon={<GetAppIcon />} data-testid='button-yh9r'>
                <TranslatedText
                  stringId="report.generate.action.download"
                  fallback="Download"
                  data-testid='translatedtext-tmhf' /> (
                {(
                  (dataReadyForSaving.getData().byteLength ?? dataReadyForSaving.getData().length) /
                  1024
                ).toFixed(0)}{' '}
                KB)
              </Button>
            ) : (
              <FormSubmitDropdownButton
                size="large"
                disabled={!values.reportId}
                actions={[
                  {
                    label: (
                      <TranslatedText
                        stringId="report.generate.action.generateXLSX"
                        fallback="Generate as .XLSX"
                        data-testid='translatedtext-19et' />
                    ),
                    onClick: event => {
                      setBookFormat(REPORT_EXPORT_FORMATS.XLSX);
                      submitForm(event);
                    },
                  },
                  {
                    label: (
                      <TranslatedText
                        stringId="report.generate.action.generateCSV"
                        fallback="Generate as .CSV"
                        data-testid='translatedtext-x6f2' />
                    ),
                    onClick: event => {
                      setBookFormat(REPORT_EXPORT_FORMATS.CSV);
                      submitForm(event);
                    },
                  },
                ]}
              />
            )}
          </Box>
        </>
      )}
    />
  );
};
