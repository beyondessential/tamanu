import { Grid, Typography } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import React, { useCallback, useState } from 'react';
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
import { Colors } from '../../constants';
import { getCurrentUser } from '../../store/auth';
import { MUI_SPACING_UNIT } from '../../constants';
import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { saveExcelFile } from '../../utils/saveExcelFile';

const REPORT_TYPE_OPTIONS = [
  {
    name: 'Incomplete referrals',
    id: 'incomplete-referrals',
    parameters: [
      { ParameterField: VillageField }, 
      { ParameterField: PractitionerField },
    ],
  },
  {
    name: 'Recent Diagnoses',
    id: 'recent-diagnoses',
    parameters: [
      {
        ParameterField: DiagnosisField,
        required: true,
        name: 'diagnosis',
        label: 'Diagnosis',
        validation: Yup.string().required('Diagnosis is required'),
      },
      { ParameterField: DiagnosisField, name: 'diagnosis2', label: 'Diagnosis 2' },
      { ParameterField: DiagnosisField, name: 'diagnosis3', label: 'Diagnosis 3' },
      { ParameterField: DiagnosisField, name: 'diagnosis4', label: 'Diagnosis 4' },
      { ParameterField: DiagnosisField, name: 'diagnosis5', label: 'Diagnosis 5' },
      { ParameterField: EmptyField },
      { ParameterField: VillageField },
      { ParameterField: PractitionerField },
    ],
  },
  {
    name: 'Admissions Report',
    id: 'admissions',
    parameters: [{ ParameterField: PractitionerField }],
  },
  {
    name: 'COVID vaccine campaign line list',
    id: 'covid-vaccine-list',
    parameters: [{ ParameterField: VillageField }],
  },
  {
    name: 'COVID vaccine campaign - First dose summary',
    id: 'covid-vaccine-summary-dose1',
    allFacilities: true,
  },
  {
    name: 'COVID vaccine campaign - Second dose summary',
    id: 'covid-vaccine-summary-dose2',
    allFacilities: true,
  },
  {
    name: 'Adverse Event Following Immunization',
    id: 'aefi',
    parameters: [{ ParameterField: VillageField }],
  },
  {
    name: 'Samoa Adverse Event Following Immunisation',
    id: 'samoa-aefi',
    parameters: [{ ParameterField: VillageField }],
  },
  {
    name: 'Number of patients registered by date',
    id: 'number-patients-registered-by-date',
    allFacilities: true,
  },
  {
    name: 'Registered patients - Line list',
    id: 'registered-patients',
  },
  {
    name: 'COVID-19 Tests - Line list',
    id: 'covid-swab-lab-test-list',
    allFacilities: true,
    parameters: [
      { ParameterField: VillageField },
      { ParameterField: LabTestLaboratoryField },
    ],
  },
  {
    name: 'COVID-19 Tests - Summary',
    id: 'covid-swab-lab-tests-summary',
    parameters: [
      { ParameterField: VillageField },
      { ParameterField: LabTestLaboratoryField },
    ],
  },
];

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

  for (var i = 0; i < emailList.length; i++) {
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

const EmptyField = styled.div``;

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
}) => {
  const [submitError, setSubmitError] = useState();
  const [parameters, setParameters] = useState([]);
  const [dataSource, setDataSource] = useState('thisFacility');
  const [isDataSourceFieldDisabled, setIsDataSourceFieldDisabled] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);
  const [reportsById, setReportsById] = useState({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      // TODO: query from server instead
      const reports = await REPORT_TYPE_OPTIONS;
      if (cancel) return;
      const byId = reports.reduce((state, current) => ({
        ...state,
        [current.id]: current,
      }), {});
      const asOptions = reports.map(r => ({ value: r.id, label: r.name }));
      setReportsById(byId);
      setAvailableReports(asOptions);
    })();
    return () => { cancel = true; }
  }, []);

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
      render={() => {
        return (
          <>
            <FormGrid columns={3}>
              <Field
                name="reportType"
                label="Report Type"
                component={ReportTypeField}
                options={availableReports}
                required
                onValueChange={id => {
                  const reportDefinition = reportsById[type];
                  setParameters(reportDefinition.parameters || []);
                  if (reportDefinition.allFacilities) {
                    setIsDataSourceFieldDisabled(true);
                    setDataSource('allFacilities');
                  } else {
                    setIsDataSourceFieldDisabled(false);
                    setDataSource('thisFacility');
                  }
                }}
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
                  {parameters.map(({ ParameterField, required, name, label }, index) => (
                    <ParameterField key={index} required={required} name={name} label={label} />
                  ))}
                </FormGrid>
              </>
            ) : null}
            <Spacer />
            <DateRangeLabel variant="body1">
              Date range (or leave blank for all data)
            </DateRangeLabel>
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
        );
      }}
    ></Form>
  );
};

const IntermediateReportGeneratorForm = connectApi(api => ({
  generateReport: async (reportType, body) => {
    return await api.post(`reports/${reportType}`, body);
  },
  createReportRequest: async request => {
    return await api.post(`reportRequest`, request);
  },
}))(DumbReportGeneratorForm);

export const ReportGeneratorForm = connect(state => ({
  currentUser: getCurrentUser(state),
}))(IntermediateReportGeneratorForm);
