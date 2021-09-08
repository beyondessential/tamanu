import { keyBy } from 'lodash';
import { Grid, Typography, CircularProgress } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import React, { useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';
import { connectApi } from '../../api';
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
import { Colors, MUI_SPACING_UNIT } from '../../constants';
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

  if (emailList.length == 0) {
    return `${emails} is invalid.`;
  }

  for (let i = 0; i < emailList.length; i++) {
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      return `${emailList[i]} is invalid.`;
    }
  }
}

const ErrorMessageContainer = styled(Grid)`
  padding: ${MUI_SPACING_UNIT * 2}px ${MUI_SPACING_UNIT * 3}px;
  background-color: ${red[50]};
  margin-top: 20px;
`;

const SubmitErrorMessage = () => {
  return (
    <ErrorMessageContainer>
      <Typography color="error">An error occurred. Please try again.</Typography>
    </ErrorMessageContainer>
  );
};

// adding an onValueChange hook to the report type field
// so we can keep internal state of the report type
const ReportTypeField = ({ onValueChange, ...props }) => {
  const changeCallback = useCallback(event => {
    onValueChange(event.target.value);
    props.field.onChange(event);
  }, []);
  return <AutocompleteField {...props} onChange={changeCallback} />;
};

const DumbReportGeneratorForm = ({
  currentUser,
  generateReport,
  onSuccessfulSubmit,
  createReportRequest,
  getReports,
}) => {
  const [submitError, setSubmitError] = useState();
  const [parameters, setParameters] = useState([]);
  const [dataSource, setDataSource] = useState('thisFacility');
  const [isDataSourceFieldDisabled, setIsDataSourceFieldDisabled] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);
  const [reportsById, setReportsById] = useState({});
  const [reportOptions, setReportOptions] = useState([]);

  useEffect(() => {
    (async () => {
      const reports = await getReports();
      setReportsById(keyBy(reports, 'id'));
      setReportOptions(reports.map(r => ({ value: r.id, label: r.name })));
      setAvailableReports(reports);
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
        setDataSource('allFacilities');
      } else {
        setIsDataSourceFieldDisabled(false);
        setDataSource('thisFacility');
      }
    },
    [reportsById],
  );

  async function submitRequestReport(formValues) {
    const { reportType, emails, ...restValues } = formValues;
    try {
      if (dataSource === 'thisFacility') {
        const excelData = await generateReport(reportType, {
          parameters: restValues,
        });

        const filePath = await saveExcelFile(excelData, {
          promptForFilePath: true,
          defaultFileName: reportType,
        });
        console.log('file saved at ', filePath);
      } else {
        await createReportRequest({
          reportType,
          parameters: restValues,
          emailList: parseEmails(formValues.emails),
        });
      }

      onSuccessfulSubmit && onSuccessfulSubmit();
    } catch (e) {
      console.error('Error submitting report request', e);
      setSubmitError(e);
    }
  }

  // Wait until available reports are loaded to render.
  // This is a workaround because of an issue that the onChange callback (when selecting a report)
  // inside render method of Formik doesn't update its dependency when the available reports list is already loaded
  if (!availableReports.length) {
    return <CircularProgress />;
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
                { label: 'This facility', value: 'thisFacility' },
                { label: 'All facilities', value: 'allFacilities' },
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
            {dataSource === 'allFacilities' ? (
              <Field
                name="emails"
                label="Email to (separate emails with a comma)"
                component={TextField}
                placeholder="example@example.com"
                multiline
                rows={3}
                validate={validateCommaSeparatedEmails}
                required={dataSource === 'allFacilities'}
              />
            ) : null}
          </EmailInputContainer>
          {submitError && <SubmitErrorMessage />}
          <Spacer />
          <Button variant="contained" color="primary" type="submit">
            Generate
          </Button>
        </>
      )}
    />
  );
};

const IntermediateReportGeneratorForm = connectApi(api => ({
  generateReport: async (reportType, body) => {
    return api.post(`reports/${reportType}`, body);
  },
  createReportRequest: async request => {
    return api.post(`reportRequest`, request);
  },
  getReports: async request => {
    return await api.get(`reports`, request);
  },
}))(DumbReportGeneratorForm);

export const ReportGeneratorForm = connect(state => ({
  currentUser: getCurrentUser(state),
}))(IntermediateReportGeneratorForm);
