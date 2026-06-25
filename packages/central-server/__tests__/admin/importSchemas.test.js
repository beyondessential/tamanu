import { SSCPatientIssue } from '../../dist/admin/importSchemas';

describe('admin import schemas', () => {
  it('allows PatientIssue config required by survey submission', async () => {
    const validated = await SSCPatientIssue.validate({
      id: 'survey-patient-issue',
      surveyId: 'survey',
      dataElementId: 'pde-patient-issue',
      screenIndex: 0,
      componentIndex: 0,
      config: JSON.stringify({
        issueType: 'warning',
        issueNote: 'Urgent referral required',
      }),
    });

    expect(JSON.parse(validated.config)).toEqual({
      issueType: 'warning',
      issueNote: 'Urgent referral required',
    });
  });
});
