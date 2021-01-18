import React from 'react';
import styled from 'styled-components';
import { connectApi } from '../../api';
import { AutocompleteField, Button, ButtonRow, Field, Form, PageContainer, TopBar } from '../../components';
import { FormGrid } from '../../components/FormGrid';
import { Suggester } from '../../utils/suggester';

const DumbReportGenerator = ({ villageSuggester, practitionerSuggester }) => {
    return (
        <PageContainer >
            <TopBar title="Report Generator" />
            <PageContent>
                <Form
                    initialValues={{
                        reportType: '',
                        village: '',
                        practitioner: ''
                    }}
                    onSubmit={(values) => {
                        console.log('on submit', values);
                    }}
                    render={() => (
                        <>
                            <FormGrid columns={3}>
                                <Field
                                    name="reportType"
                                    placeholder="Report type"
                                    component={AutocompleteField}
                                    options={[
                                        { label: 'Incomplete referrals', value: 'incomplete-referrals' },
                                        { label: 'Recent Diagnoses', value: 'recent-diagnoses' },
                                        { label: 'Admissions Report', value: 'admissions-report' }]}
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

const PageContent = styled.div`
    padding: 24px;
`;

const GenerateButton = styled(Button)`
    margin-top: 48px;
`

export const ReportGenerator = connectApi(api => ({
    villageSuggester: new Suggester(api, 'village'),
    practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbReportGenerator);