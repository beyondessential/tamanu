import { Typography } from '@material-ui/core';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';
import { connectApi } from '../../api';
import { AutocompleteField, Button, DateField, Field, Form, PageContainer, TextAreaField, TextField, TopBar } from '../../components';
import { FormGrid } from '../../components/FormGrid';
import { Colors } from '../../constants';
import { getCurrentUser } from '../../store/auth';
import { Suggester } from '../../utils/suggester';

const REPORT_TYPE_OPTIONS = [
  { label: 'Incomplete referrals', value: 'incomplete-referrals' },
  { label: 'Recent Diagnoses', value: 'recent-diagnoses' },
  { label: 'Admissions Report', value: 'admissions-report' }
];

const PageContent = styled.div`
  padding: 24px;
`;

const GenerateButton = styled(Button)`
  margin-top: 48px;
`

const DateRangeLabel = styled(Typography)`
  font-weight: 500;
  margin-top: 30px;
  margin-bottom: 5px;
  color: ${Colors.darkText};
`;

const EmailInputContainer = styled.div`
  margin-top: 30px;
  width: 60%;
`;

const ReportGenerateFormSchema = Yup.object().shape({
  reportType: Yup.string().required('Report type is required'),
});

function parseEmails(commaSeparatedEmails) {
  return commaSeparatedEmails.split(',').filter(email => email).map(address => address.trim());
}

const emailSchema = Yup.string().email();

async function validateCommaSeparatedEmails(emails) {
  if (!emails) {
    return 'At least 1 email address is required';
  }
  const emailList = parseEmails(emails);
  for (var i = 0; i < emailList.length; i++) {
    let error;
    const isEmailValid = await emailSchema.isValid(emailList[i]);
    if (!isEmailValid) {
      error = `${emailList[i]} is invalid.`;
      if (emailList[i].includes(';')) {
        error += ' Please use comma (,) to separate multiple email addresses.';
      }
      return error;
    }
  }
}

const DumbReportGenerator = ({ villageSuggester, practitionerSuggester, currentUser }) => {
  return (
    <PageContainer >
      <TopBar title="Report Generator" />
      <PageContent>
        <Form
          initialValues={{
            reportType: '',
            village: '',
            practitioner: '',
            emails: currentUser.email
          }}
          onSubmit={(values) => {
            console.log('on submit', values, parseEmails(values.emails));
          }}
          validationSchema={ReportGenerateFormSchema}
          render={() => (
            <>
              <FormGrid columns={3}>
                <Field
                  name="reportType"
                  placeholder="Report type"
                  component={AutocompleteField}
                  options={REPORT_TYPE_OPTIONS}
                  required
                />
                <Field
                  name="village"
                  placeholder="Village"
                  component={AutocompleteField}
                  suggester={villageSuggester}
                />
                <Field
                  name="practitioner"
                  placeholder="Doctor/Nurse"
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
              </FormGrid>
              <DateRangeLabel variant="body1">Date range (or leave blank for all data)</DateRangeLabel>
              <FormGrid columns={2}>
                <Field name="fromDate" label="From date" component={DateField} />
                <Field name="toDate" label="To date" component={DateField} />
              </FormGrid>
              <EmailInputContainer>
                <Field name="emails"
                  label="Email to (separate emails with a comma)"
                  component={TextField}
                  placeholder="example@example.com"
                  multiline
                  rows={3}
                  validate={validateCommaSeparatedEmails}
                />
              </EmailInputContainer>
              <GenerateButton variant="contained" color="primary" type="submit">
                Generate
              </GenerateButton>
            </>
          )}>

        </Form>
      </PageContent>
    </PageContainer>
  )
}

const IntermediateReportGenerator = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbReportGenerator);

export const ReportGenerator = connect(state => ({
  currentUser: getCurrentUser(state)
}))(IntermediateReportGenerator);