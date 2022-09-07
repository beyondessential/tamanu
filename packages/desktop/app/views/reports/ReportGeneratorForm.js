import { keyBy } from 'lodash';
import { Grid, Typography } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';
import { REPORT_DATA_SOURCES, REPORT_DATA_SOURCE_VALUES } from 'shared/constants';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { connectApi, useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import {
  AutocompleteField,
  Button,
  DateField,
  Field,
  Form,
  RadioField,
  TextField,
  SelectField,
  MultiselectField,
} from '../../components';
import { FormGrid } from '../../components/FormGrid';
import { Colors, MUI_SPACING_UNIT } from '../../constants';

import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { saveExcelFile } from '../../utils/saveExcelFile';
import { VaccineCategoryField } from './VaccineCategoryField';
import { VaccineField } from './VaccineField';
import { Suggester } from '../../utils/suggester';
import { ImagingTypeField } from './ImagingTypeField';
import { LabTestCategoryField } from './LabTestCategoryField';

const EmptyField = styled.div``;

const ParameterAutocompleteField = connectApi((api, _, props) => ({
  suggester: new Suggester(api, props.suggesterEndpoint, props.suggesterOptions),
}))(props => <Field component={AutocompleteField} suggester={props.suggester} {...props} />);

const ParameterSelectField = props => <Field component={SelectField} {...props} />;
const ParameterMultiselectField = props => <Field component={MultiselectField} {...props} />;

const PARAMETER_FIELD_COMPONENTS = {
  VillageField,
  LabTestLaboratoryField,
  PractitionerField,
  DiagnosisField,
  VaccineCategoryField,
  VaccineField,
  EmptyField,
  ParameterAutocompleteField,
  ParameterSelectField,
  ParameterMultiselectField,
  ImagingTypeField,
  LabTestCategoryField,
};

const Spacer = styled.div`
  padding-top: 30px;
`;

const DateRangeLabel = styled(Typography)`
  font-weight: 500;
  margin-bottom: 5px;
  color: ${Colors.darkText};
`;

const EmailInputContainer = styled.div`
  width: 60%;
`;

function parseEmails(commaSeparatedEmails) {
  return commaSeparatedEmails
    .split(/[;,]/)
    .map(address => address.trim())
    .filter(email => email);
}

const emailSchema = Yup.string().email();

async function validateCommaSeparatedEmails(emails) {
  if (!emails) {
    return 'At least 1 email address is required';
  }
  const emailList = parseEmails(emails);

  if (emailList.length === 0) {
    return `${emails} is invalid.`;
  }

  for (let i = 0; i < emailList.length; i++) {
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      return `${emailList[i]} is invalid.`;
    }
  }

  return '';
}

const buildParameterFieldValidation = ({ name, required }) => {
  if (required) return Yup.mixed().required(`${name} is a required field`);

  return Yup.mixed();
};

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

const getAvailableReports = async api => api.get('reports');

const generateFacilityReport = async (api, reportType, parameters) =>
  api.post(`reports/${reportType}`, {
    parameters,
  });

const submitReportRequest = async (api, reportType, parameters, emails) =>
  api.post('reportRequest', {
    reportType,
    parameters,
    emailList: parseEmails(emails),
  });

// adding an onValueChange hook to the report type field
// so we can keep internal state of the report type
const ReportTypeField = ({ onValueChange, ...props }) => {
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

export const ReportGeneratorForm = ({ onSuccessfulSubmit }) => {
  const api = useApi();
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
        const reports = await getAvailableReports(api);
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
      const { reportType, emails, ...restValues } = formValues;
      try {
        if (dataSource === REPORT_DATA_SOURCES.THIS_FACILITY) {
          const excelData = await generateFacilityReport(api, reportType, restValues);

          const filePath = await saveExcelFile(excelData, {
            promptForFilePath: true,
            defaultFileName: reportType,
          });
          // eslint-disable-next-line no-console
          console.log('file saved at ', filePath);
        } else {
          await submitReportRequest(api, reportType, restValues, formValues.emails);
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
    [api, dataSource, onSuccessfulSubmit],
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
        reportType: '',
        emails: currentUser.email,
        ...parameters.reduce((acc, { name }) => ({ ...acc, [name]: null }), {}),
      }}
      onSubmit={submitRequestReport}
      validationSchema={Yup.object().shape({
        reportType: Yup.string().required('Report type is required'),
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
              name="reportType"
              label="Report type"
              component={ReportTypeField}
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
                  const ParameterFieldComponent = PARAMETER_FIELD_COMPONENTS[parameterField];
                  return (
                    <ParameterFieldComponent
                      key={name}
                      required={required}
                      name={name}
                      label={label}
                      parameterValues={values}
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
          <Spacer />
          <EmailInputContainer>
            {dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES ? (
              <Field
                name="emails"
                label="Email to (separate emails with a comma)"
                component={TextField}
                placeholder="example@example.com"
                multiline
                rows={3}
                validate={validateCommaSeparatedEmails}
                required={dataSource === REPORT_DATA_SOURCES.ALL_FACILITIES}
              />
            ) : null}
          </EmailInputContainer>
          {requestError && <RequestErrorMessage errorMessage={requestError} />}
          <Spacer />
          <Button variant="contained" color="primary" type="submit">
            Generate
          </Button>
        </>
      )}
    />
  );
};
