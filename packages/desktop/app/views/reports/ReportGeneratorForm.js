import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { keyBy } from 'lodash';
import { format } from 'date-fns';
import { Grid, Typography } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import styled from 'styled-components';
import * as Yup from 'yup';
import { REPORT_DATA_SOURCES, REPORT_DATA_SOURCE_VALUES } from 'shared/constants';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import {
  AutocompleteField,
  Button,
  FormGrid,
  DateField,
  Field,
  Form,
  RadioField,
} from '../../components';
import { Colors, MUI_SPACING_UNIT } from '../../constants';
import { saveExcelFile } from '../../utils/saveExcelFile';
import { EmailField, parseEmails } from './EmailField';
import { ParameterField } from './ParameterField';
import { useLocalisation } from '../../contexts/Localisation';

const Spacer = styled.div`
  padding-top: 30px;
`;

const DateRangeLabel = styled(Typography)`
  font-weight: 500;
  margin-bottom: 5px;
  color: ${Colors.darkText};
`;

const EmailInputContainer = styled.div`
  padding-top: 30px;
  width: 60%;
`;

const ErrorMessageContainer = styled(Grid)`
  padding: ${MUI_SPACING_UNIT * 2}px ${MUI_SPACING_UNIT * 3}px;
  background-color: ${red[50]};
  margin-top: 20px;
`;

const RequestErrorMessage = ({ errorMessage }) => (
  <ErrorMessageContainer>
    <Typography color="error">{`Error: ${errorMessage}`}</Typography>
  </ErrorMessageContainer>
);

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

  return reportName => {
    const dashedName = `${reportName}-${country.name}`
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `tamanu-report-${date}-${dashedName}`;
  };
};

export const ReportGeneratorForm = ({ onSuccessfulSubmit }) => {
  const api = useApi();
  const getFileName = useFileName();
  const { currentUser } = useAuth();
  const [requestError, setRequestError] = useState();
  const [availableReports, setAvailableReports] = useState([]);
  const [dataSource, setDataSource] = useState(REPORT_DATA_SOURCES.THIS_FACILITY);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const reportsById = useMemo(() => keyBy(availableReports, 'id'), [availableReports]);
  const reportOptions = useMemo(() => availableReports.map(r => ({ value: r.id, label: r.name })), [
    availableReports,
  ]);

  const {
    parameters = [],
    dateRangeLabel = 'Date range',
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
        // eslint-disable-next-line no-console
        console.error(`Unable to load available reports`, error);
        setRequestError(`Unable to load available reports - ${error.message}`);
      }
    })();
  }, [api]);

  const submitRequestReport = useCallback(
    async formValues => {
      const { reportId, emails, ...filterValues } = formValues;

      try {
        if (dataSource === REPORT_DATA_SOURCES.THIS_FACILITY) {
          const excelData = await api.post(`reports/${reportId}`, {
            parameters: filterValues,
          });

          const filterString = Object.entries(filterValues)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

          const reportName = reportsById[reportId].name;

          const date = format(new Date(), 'dd/MM/yyyy');

          const metadata = [
            ['Report Name:', reportName],
            ['Date Generated:', date],
            ['User:', currentUser.email],
            ['Filters:', filterString],
          ];

          const filePath = await saveExcelFile(
            { data: excelData, metadata },
            {
              promptForFilePath: true,
              defaultFileName: getFileName(reportName),
            },
          );
          // eslint-disable-next-line no-console
          console.log('file saved at ', filePath);
        } else {
          await api.post(`reportRequest`, {
            reportId,
            filterValues,
            emailList: parseEmails(formValues.emails),
          });
        }

        if (onSuccessfulSubmit) {
          onSuccessfulSubmit();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Unable to submit report request', e);
        setRequestError(`Unable to submit report request - ${e.message}`);
      }
    },
    [api, dataSource, onSuccessfulSubmit, reportsById],
  );

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
        ...parameters.reduce((acc, { name }) => ({ ...acc, [name]: null }), {}),
      }}
      onSubmit={submitRequestReport}
      validationSchema={Yup.object().shape({
        reportId: Yup.string().required('Report id is required'),
        ...parameters.reduce(
          (schema, field) => ({
            ...schema,
            [field.name]: buildParameterFieldValidation(field),
          }),
          {},
        ),
      })}
      render={({ values }) => (
        <>
          <FormGrid columns={3}>
            <Field
              name="reportId"
              label="Report"
              component={ReportIdField}
              options={reportOptions}
              required
              onValueChange={setSelectedReportId}
            />
            <Field
              name="dataSource"
              label="For"
              value={dataSource}
              onChange={e => {
                setDataSource(e.target.value);
              }}
              options={[
                { label: 'This facility', value: REPORT_DATA_SOURCES.THIS_FACILITY },
                { label: 'All facilities', value: REPORT_DATA_SOURCES.ALL_FACILITIES },
              ]}
              component={RadioField}
              disabled={isDataSourceFieldDisabled}
            />
          </FormGrid>
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
                      {...restOfProps}
                    />
                  );
                })}
              </FormGrid>
            </>
          ) : null}
          <Spacer />
          <DateRangeLabel variant="body1">{dateRangeLabel}</DateRangeLabel>
          <FormGrid columns={2}>
            <Field name="fromDate" label="From date" component={DateField} />
            <Field name="toDate" label="To date" component={DateField} />
          </FormGrid>
          <EmailInputContainer>
            {dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES ? <EmailField /> : null}
          </EmailInputContainer>
          {requestError && <RequestErrorMessage errorMessage={requestError} />}
          <Spacer />
          <Button type="submit">Generate</Button>
        </>
      )}
    />
  );
};
