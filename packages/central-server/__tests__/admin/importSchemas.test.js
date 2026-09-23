import { describe, expect, it } from 'vitest';
import { SSCPatientData, SSCPatientIssue, SSCPhoto } from '../../app/admin/importSchemas';

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

  const photoQuestion = config => ({
    id: 'survey-photo',
    surveyId: 'survey',
    dataElementId: 'pde-photo',
    screenIndex: 0,
    componentIndex: 0,
    ...(config === undefined ? {} : { config: JSON.stringify(config) }),
  });

  it('allows a Photo question to write the captured image to the profile photo', async () => {
    const validated = await SSCPhoto.validate(
      photoQuestion({ writeToPatient: { fieldName: 'profilePhoto' } }),
      { context: {} },
    );

    expect(JSON.parse(validated.config)).toEqual({
      writeToPatient: { fieldName: 'profilePhoto' },
    });
  });

  it('allows a Photo question with no config at all', async () => {
    const validated = await SSCPhoto.validate(photoQuestion(undefined), { context: {} });
    expect(validated.config).toBeUndefined();
  });

  it('refuses a Photo question writing to any other patient field', async () => {
    await expect(
      SSCPhoto.validate(photoQuestion({ writeToPatient: { fieldName: 'email' } }), {
        context: {},
      }),
    ).rejects.toThrow();
  });

  it('refuses an ordinary PatientData question writing to the profile photo', async () => {
    await expect(
      SSCPatientData.validate(
        {
          id: 'survey-patient-data',
          surveyId: 'survey',
          dataElementId: 'pde-patient-data',
          screenIndex: 0,
          componentIndex: 0,
          config: JSON.stringify({
            writeToPatient: { fieldName: 'profilePhoto', fieldType: 'FreeText' },
          }),
        },
        { context: { customPatientFieldIds: [] } },
      ),
    ).rejects.toThrow();
  });
});
