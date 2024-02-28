import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { keyBy, orderBy } from 'lodash';
import { format } from 'date-fns';
import { Box, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
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
  DateDisplay,
  DateField,
  Field,
  Form,
  FormGrid,
  RadioField,
  TextButton,
} from '../../components';
import { FormSubmitDropdownButton } from '../../components/DropdownButton';
import { Colors } from '../../constants';
import { saveExcelFile } from '../../utils/saveExcelFile';
import { EmailField, parseEmails } from './EmailField';
import { ParameterField } from './ParameterField';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../components/Translation/TranslatedReferenceData';
import { ReportAboutModal } from './ReportAboutModal';

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
  return <AutocompleteField {...props} onChange={changeCallback} />;
};

const buildParameterFieldValidation = ({ name, required }) => {
  if (required) return Yup.mixed().required(`${name} is a required field`);

  return Yup.mixed();
};

const useFileName = () => {
  const { getLocalisation } = useLocalisation();
  const country = getLocalisation('country');
  const date = format(new Date(), 'ddMMyyyy');

  const countryName = <span>
    <TranslatedReferenceData fallback={country.name} value={country.id} category="country"/>
  </span>;

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
  const getFileName = useFileName();
  const { currentUser } = useAuth();
  const [successMessage, setSuccessMessage] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [bookType, setBookFormat] = useState(REPORT_EXPORT_FORMATS.XLSX);
  const [availableReports, setAvailableReports] = useState([]);
  const [dataSource, setDataSource] = useState(REPORT_DATA_SOURCES.THIS_FACILITY);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
      <TranslatedText stringId="report.generate.dateRange.label" fallback="Date range" />
    ),
    dataSourceOptions = REPORT_DATA_SOURCE_VALUES,
    filterDateRangeAsStrings = false,
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
            />
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

        try {
          await saveExcelFile({
            data: excelData,
            metadata,
            defaultFileName: getFileName(reportName),
            bookType,
          });
          setSuccessMessage(
            <TranslatedText
              stringId="report.generate.message.export.success"
              fallback="Report successfully exported"
            />,
          );
        } catch (error) {
          setRequestError(`Unable to export report - ${error.message}`);
        }
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
          />,
        );
      }
    } catch (e) {
      setRequestError(
        <TranslatedText
          stringId="reportGenerator.error.cantSubmitRequest"
          fallback="Unable to submit report request - :errorMessage"
          replacements={{ errorMessage: e.message }}
        />,
      );
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
      onSubmit={submitRequestReport}
      validationSchema={Yup.object().shape({
        reportId: Yup.string().required(
          <TranslatedText
            stringId="report.generate.validation.reportId.required"
            fallback="Report id is required. A report must be selected from the dropdown; just entering a report name will not work. If you can't see a specific report, please contact your system administrator."
          />,
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
              label={
                <TranslatedText stringId="report.generate.report.label" fallback="Report" />
              }
              component={ReportIdField}
              options={reportOptions}
              required
              onValueChange={reportId => {
                setSelectedReportId(reportId);
                clearForm();
              }}
            />
            <Field
              name="dataSource"
              label=" "
              value={dataSource}
              onChange={e => {
                setDataSource(e.target.value);
              }}
              options={[
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.dataSource.option.thisFacility"
                      fallback="This facility"
                    />
                  ),
                  value: REPORT_DATA_SOURCES.THIS_FACILITY,
                },
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.dataSource.option.allFacilities"
                      fallback="All facilities"
                    />
                  ),
                  value: REPORT_DATA_SOURCES.ALL_FACILITIES,
                },
              ]}
              component={RadioField}
              disabled={isDataSourceFieldDisabled}
            />
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
                {parameters.map(({ parameterField, required, name, label, ...restOfProps }) => (
                  <ParameterField
                    key={name || parameterField}
                    required={required}
                    name={name}
                    label={label}
                    parameterValues={values}
                    parameterField={parameterField}
                    {...restOfProps}
                  />
                ))}
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
                />
              }
              component={DateField}
              saveDateAsString={filterDateRangeAsStrings}
            />
            <Field
              name="toDate"
              label={
                <TranslatedText stringId="report.generate.toDate.label" fallback="To date" />
              }
              component={DateField}
              saveDateAsString={filterDateRangeAsStrings}
            />
          </FormGrid>
          {dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES && (
            <EmailInputContainer>
              <EmailField />
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
              {`Error: ${requestError}`}
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
          <Box display="flex" justifyContent="flex-end">
            <FormSubmitDropdownButton
              size="large"
              actions={[
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.action.generateXLSX"
                      fallback="Generate XLSX"
                    />
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
                      fallback="Generate CSV"
                    />
                  ),
                  onClick: event => {
                    setBookFormat(REPORT_EXPORT_FORMATS.CSV);
                    submitForm(event);
                  },
                },
              ]}
            />
          </Box>
        </>
      )}
    />
  );
};
