import {
  normalizeQuestionConfigForImport,
  sanitizeProgramDefinitionPreview,
} from '../../dist/admin/programImporter/programDefinition';

describe('programDefinition', () => {
  it('normalizes generated PatientIssue issue types to Tamanu values', () => {
    expect(
      normalizeQuestionConfigForImport({
        type: 'PatientIssue',
        config: {
          issueType: 'urgent-referral',
          issueNote: 'Urgent referral required',
        },
      }),
    ).toEqual({
      issueType: 'warning',
      issueNote: 'Urgent referral required',
    });
  });

  it('moves generated normalRange config onto validationCriteria', () => {
    expect(
      sanitizeProgramDefinitionPreview({
        title: 'NCD Follow-up Review',
        surveys: [
          {
            code: 'ncdreview',
            name: 'NCD Follow-up Review',
            status: 'draft',
          },
        ],
        surveySheets: [
          {
            surveyName: 'NCD Follow-up Review',
            questions: [
              {
                code: 'ncdreview010',
                name: 'ncdreview010',
                text: 'Blood pressure',
                type: 'Number',
                config: {
                  normalRange: { min: 90, max: 140 },
                  unit: 'mmHg',
                },
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      surveys: [
        {
          code: 'ncdreview',
          name: 'NCD Follow-up Review',
        },
      ],
      surveySheets: [
        {
          questions: [
            {
              config: {
                unit: 'mmHg',
              },
              validationCriteria: {
                normalRange: { min: 90, max: 140 },
              },
            },
          ],
        },
      ],
    });
  });
});
