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
  FORM_TYPES,
} from '@tamanu/constants';
import {
  Form,
  FormGrid,
  TextButton,
  Button,
  useDateTime,
  ThemedTooltip,
} from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { AutocompleteField, DateField, Field, RadioField } from '../../components';
import { FormSubmitDropdownButton } from '../../components/DropdownButton';
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
  return (
    <AutocompleteField {...props} onChange={changeCallback} data-testid="autocompletefield-pky7" />
  );
};

const buildParameterFieldValidation = ({ required }) => {
  if (required) return Yup.mixed().required();

  return Yup.mixed();
};

const useFileName = () => {
  const { getLocalisation } = useLocalisation();
  const { getCurrentDate } = useDateTime();
  const country = getLocalisation('country');
  const date = getCurrentDate();
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

const getAboutReportText = reportName => (
  <TranslatedText
    stringId="report.generate.about.label"
    fallback="About :reportName"
    replacements={{ reportName }}
    data-testid="translatedtext-report-about-modal-title"
  />
);

const isJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const getTimeZoneDisplayLabel = tz =>
  tz
    ?.split('/')
    ?.pop()
    ?.replace(/_/g, ' ') ?? tz;

const TimezoneLabel = ({ timeZone }) => (
  <ThemedTooltip title={timeZone} placement="top" arrow>
    <span>{getTimeZoneDisplayLabel(timeZone)}</span>
  </ThemedTooltip>
);

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
  const { primaryTimeZone, facilityTimeZone } = useDateTime();
  const showTimeZoneSelector = facilityTimeZone && facilityTimeZone !== primaryTimeZone;
  const timezoneOptions = useMemo(
    () => [
      {
        label: <TimezoneLabel timeZone={primaryTimeZone} />,
        description: (
          <TranslatedText
            stringId="report.generate.timezone.option.country"
            fallback="Use primary timezone for Tamanu deployment"
            data-testid="translatedtext-tz-country"
          />
        ),
        value: primaryTimeZone,
      },
      {
        label: <TimezoneLabel timeZone={facilityTimeZone} />,
        description: (
          <TranslatedText
            stringId="report.generate.timezone.option.facility"
            fallback="Use facility configured timezone"
            data-testid="translatedtext-tz-facility"
          />
        ),
        value: facilityTimeZone,
      },
    ],
    [primaryTimeZone, facilityTimeZone],
  );

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
        data-testid="translatedtext-hf3l"
      />
    ),
    dataSourceOptions = REPORT_DATA_SOURCE_VALUES,
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
              data-testid="translatedtext-jzpc"
            />
          )} - ${error.message}`,
        );
      }
    })();
  }, [api]);

  const submitRequestReport = async formValues => {
    const { reportId, emails, timezone, ...filterValues } = formValues;

    const parsedParameters = Object.fromEntries(
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
          parameters: { ...parsedParameters, timezone },
          facilityId,
        });

        const filterString = Object.entries(filterValues)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        const reportName = reportsById[reportId].name;

        const metadata = [
          ['Report Name:', reportName],
          ['Date Generated:', format(new Date(), 'ddMMyyyy')],
          ['User:', currentUser.email],
          ['Filters:', filterString],
          ['Timezone:', timezone],
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
          parameters: { ...parsedParameters, timezone },
          emailList: parseEmails(emails),
          bookType,
        });
        setSuccessMessage(
          <TranslatedText
            stringId="report.generate.message.request.success"
            fallback="Report successfully requested. You will receive an email soon."
            data-testid="translatedtext-byjn"
          />,
        );
      }
    } catch (e) {
      setRequestError(
        <TranslatedText
          stringId="reportGenerator.error.cantSubmitRequest"
          fallback="Unable to submit report request - :errorMessage"
          replacements={{ errorMessage: e.message }}
          data-testid="translatedtext-mrf5"
        />,
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
          data-testid="translatedtext-mr0n"
        />,
      );
    } catch (error) {
      setRequestError(`Unable to export report - ${error.message}`);
    }
  };

  // Wait until available reports are loaded to render.
  // This is a workaround because of an issue that the onChange callback (when selecting a report)
  // inside render method of Formik doesn't update its dependency when the available reports list is already loaded
  if (Array.isArray(availableReports) === false && !requestError) {
    return <LoadingIndicator backgroundColor="#f7f9fb" data-testid="loadingindicator-y4n3" />;
  }

  return (
    <Form
      initialValues={{
        reportId: '',
        emails: currentUser.email,
        timezone: primaryTimeZone,
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
      render={({ values, submitForm, ...formProps }) => (
        <>
          <FormGrid columns={2} data-testid="formgrid-8gz6">
            <Field
              name="reportId"
              label={
                <TranslatedText
                  stringId="report.generate.report.label"
                  fallback="Report"
                  data-testid="translatedtext-2jvz"
                />
              }
              component={ReportIdField}
              options={reportOptions}
              required
              onValueChange={reportId => {
                setSelectedReportId(reportId);
                formProps.resetForm({
                  values: {
                    reportId,
                    emails: values.emails || currentUser.email,
                    timezone: values.timezone || primaryTimeZone,
                  },
                });
                resetDownload();
              }}
              data-testid="field-sg1t"
            />
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
                      data-testid="translatedtext-jqr4"
                    />
                  ),
                  value: REPORT_DATA_SOURCES.THIS_FACILITY,
                },
                {
                  label: (
                    <TranslatedText
                      stringId="report.generate.dataSource.option.allFacilities"
                      fallback="All facilities"
                      data-testid="translatedtext-mdzf"
                    />
                  ),
                  value: REPORT_DATA_SOURCES.ALL_FACILITIES,
                },
              ]}
              component={RadioField}
              disabled={isDataSourceFieldDisabled}
              data-testid="field-ran8"
            />
          </FormGrid>
          {reportsById[selectedReportId]?.notes && (
            <>
              <FormGrid columns={1} data-testid="formgrid-seem">
                <AboutReportButton
                  onClick={() => setIsReportModalOpen(true)}
                  data-testid="aboutreportbutton-xxge"
                >
                  {getAboutReportText(reportsById[selectedReportId].name)}
                </AboutReportButton>
              </FormGrid>
              <ReportAboutModal
                title={getAboutReportText(reportsById[selectedReportId].name)}
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                content={reportsById[selectedReportId].notes}
                data-testid="reportaboutmodal-8od0"
              />
            </>
          )}
          {parameters.length > 0 ? (
            <>
              <Spacer data-testid="spacer-98f7" />
              <FormGrid columns={3} data-testid="formgrid-iobt">
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
                      data-testid={`parameterfield-g4og-${name || parameterField}`}
                    />
                  );
                })}
              </FormGrid>
            </>
          ) : null}
          <DateRangeLabel variant="body1" data-testid="daterangelabel-r96n">
            {dateRangeLabel}
          </DateRangeLabel>
          {showTimeZoneSelector && (
            <FormGrid columns={1} style={{ marginBottom: 16 }} data-testid="formgrid-tz">
              <Field
                name="timezone"
                label={
                  <TranslatedText
                    stringId="report.generate.timezone.label"
                    fallback="Timezone"
                    data-testid="translatedtext-tz"
                  />
                }
                onChange={() => resetDownload()}
                options={timezoneOptions}
                component={RadioField}
                required
                data-testid="field-tz"
              />
            </FormGrid>
          )}
          <FormGrid columns={2} style={{ marginBottom: 30 }} data-testid="formgrid-v8bv">
            <Field
              name="fromDate"
              label={
                <TranslatedText
                  stringId="report.generate.fromDate.label"
                  fallback="From date"
                  data-testid="translatedtext-ckj1"
                />
              }
              onChange={() => resetDownload()}
              component={DateField}
              data-testid="field-nozf"
            />
            <Field
              name="toDate"
              label={
                <TranslatedText
                  stringId="report.generate.toDate.label"
                  fallback="To date"
                  data-testid="translatedtext-5ucj"
                />
              }
              onChange={() => resetDownload()}
              component={DateField}
              data-testid="field-2d95"
            />
          </FormGrid>
          {dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES && (
            <EmailInputContainer data-testid="emailinputcontainer-hss0">
              <EmailField onChange={() => resetDownload()} data-testid="emailfield-t4vt" />
            </EmailInputContainer>
          )}
          {requestError && (
            <Alert
              severity="error"
              style={{ marginBottom: 20 }}
              onClose={() => {
                setRequestError(null);
              }}
              data-testid="alert-us27"
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
              data-testid="alert-vt6q"
            >
              <AlertTitle data-testid="alerttitle-8846">Success</AlertTitle>
              {successMessage}
            </Alert>
          )}
          <Box display="flex" justifyContent="flex-end" gridGap="1em" data-testid="box-5cle">
            {dataReadyForSaving ? (
              <Button
                onClick={onDownload}
                startIcon={<GetAppIcon data-testid="getappicon-xgvk" />}
                data-testid="button-f4xo"
              >
                <TranslatedText
                  stringId="report.generate.action.download"
                  fallback="Download"
                  data-testid="translatedtext-97hn"
                />{' '}
                (
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
                        data-testid="translatedtext-2hhw"
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
                        fallback="Generate as .CSV"
                        data-testid="translatedtext-h038"
                      />
                    ),
                    onClick: event => {
                      setBookFormat(REPORT_EXPORT_FORMATS.CSV);
                      submitForm(event);
                    },
                  },
                ]}
                data-testid="formsubmitdropdownbutton-2ik1"
              />
            )}
          </Box>
        </>
      )}
      data-testid="form-o74s"
    />
  );
};
