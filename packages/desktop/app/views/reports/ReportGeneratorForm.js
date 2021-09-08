import { keyBy } from 'lodash';
import { Grid, Typography } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import React, { useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';
import {
  AutocompleteField,
  Button,
  DateField,
  Field,
  Form,
  RadioField,
  TextField,
} from '../../components';
import { FormGrid } from '../../components/FormGrid';
import { Colors, MUI_SPACING_UNIT, REPORT_DATA_SOURCES } from '../../constants';
import { getCurrentUser } from '../../store/auth';

import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { saveExcelFile } from '../../utils/saveExcelFile';
import { VaccineCategoryField } from './VaccineCategoryField';
import { VaccineField } from './VaccineField';

const EmptyField = styled.div``;

const PARAMETER_FIELD_COMPONENTS = {
  VillageField: VillageField,
  LabTestLaboratoryField: LabTestLaboratoryField,
  PractitionerField: PractitionerField,
  DiagnosisField: DiagnosisField,
  VaccineCategoryField: VaccineCategoryField,
  VaccineField: VaccineField,
  EmptyField: EmptyField,
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

const ErrorMessageContainer = styled(Grid)`
  padding: ${MUI_SPACING_UNIT * 2}px ${MUI_SPACING_UNIT * 3}px;
  background-color: ${red[50]};
  margin-top: 20px;
`;

const RequestErrorMessage = ({ errorMessage }) => {
  return (
    <ErrorMessageContainer>
      <Typography color="error">{`Error: ${errorMessage}`}</Typography>
    </ErrorMessageContainer>
  );
};

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
  const changeCallback = useCallback(event => {
    onValueChange(event.target.value);
    props.field.onChange(event);
  }, []);
  return <AutocompleteField {...props} onChange={changeCallback} />;
};

const DumbReportGeneratorForm = ({ currentUser, onSuccessfulSubmit }) => {
  const api = useApi();
  const [requestError, setRequestError] = useState();
  const [parameters, setParameters] = useState([]);
  const [dataSource, setDataSource] = useState(REPORT_DATA_SOURCES.THIS_FACILITY);
  const [isDataSourceFieldDisabled, setIsDataSourceFieldDisabled] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);
  const [reportsById, setReportsById] = useState({});
  const [reportOptions, setReportOptions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const reports = await getAvailableReports(api);
        setReportsById(keyBy(reports, 'id'));
        setReportOptions(reports.map(r => ({ value: r.id, label: r.name })));
        setAvailableReports(reports);
      } catch (error) {
        console.error(`Unable to load available reports`, error);
        setRequestError(`Unable to load available reports - ${error.message}`);
      }
    })();
  }, []);

  const selectReportHandle = useCallback(
    id => {
      const reportDefinition = reportsById[id];
      if (!reportDefinition) {
        return;
      }

      setParameters(reportDefinition.parameters || []);
      if (reportDefinition.allFacilities) {
        setIsDataSourceFieldDisabled(true);
        setDataSource(REPORT_DATA_SOURCES.ALL_FACILITIES);
      } else {
        setIsDataSourceFieldDisabled(false);
        setDataSource(REPORT_DATA_SOURCES.THIS_FACILITY);
      }
    },
    [reportsById],
  );

  async function submitRequestReport(formValues) {
    const { reportType, emails, ...restValues } = formValues;
    try {
      if (dataSource === REPORT_DATA_SOURCES.THIS_FACILITY) {
        const excelData = await generateFacilityReport(api, reportType, restValues);

        const filePath = await saveExcelFile(excelData, {
          promptForFilePath: true,
          defaultFileName: reportType,
        });
        console.log('file saved at ', filePath);
      } else {
        await submitReportRequest(api, reportType, restValues, formValues.emails);
      }

      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
    } catch (e) {
      console.error('Unable to submit report request', e);
      setRequestError(`Unable to submit report request - ${e.message}`);
    }
  }

  // Wait until available reports are loaded to render.
  // This is a workaround because of an issue that the onChange callback (when selecting a report)
  // inside render method of Formik doesn't update its dependency when the available reports list is already loaded
  if (!availableReports.length && !requestError) {
    return <LoadingIndicator backgroundColor="#f7f9fb" />;
  }

  return (
    <Form
      initialValues={{
        reportType: '',
        emails: currentUser.email,
      }}
      onSubmit={submitRequestReport}
      validationSchema={Yup.object().shape({
        reportType: Yup.string().required('Report type is required'),
        ...parameters
          .filter(field => field.validation)
          .reduce((schema, field) => {
            schema[field.name] = field.validation;
            return schema;
          }, {}),
      })}
      render={({ values }) => (
        <>
          <FormGrid columns={3}>
            <Field
              name="reportType"
              label="Report Type"
              component={ReportTypeField}
              options={reportOptions}
              required
              onValueChange={selectReportHandle}
            />
            <Field
              name="dataSource"
              label="For"
              value={dataSource}
              onChange={e => {
                setDataSource(e.target.value);
              }}
              inline
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
                {parameters.map(({ parameterField, required, name, label }, index) => {
                  const ParameterFieldComponent = PARAMETER_FIELD_COMPONENTS[parameterField];
                  return (
                    <ParameterFieldComponent
                      key={index}
                      required={required}
                      name={name}
                      label={label}
                      parameterValues={values}
                    />
                  );
                })}
              </FormGrid>
            </>
          ) : null}
          <Spacer />
          <DateRangeLabel variant="body1">Date range (or leave blank for all data)</DateRangeLabel>
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

export const ReportGeneratorForm = connect(state => ({
  currentUser: getCurrentUser(state),
}))(DumbReportGeneratorForm);
