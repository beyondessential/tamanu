import {
  normalizeQuestionConfigForImport,
  programDefinitionSchema,
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

  it('requires a name on every question (so the build prompt cannot fall back to the code)', async () => {
    // The form response viewer's "Indicator" column shows ProgramDataElement.name.
    // Forcing name in the structured-output schema stops the LLM silently omitting
    // it and saving the code as a stand-in (which renders responses as e.g.
    // "ncdreview010" instead of "Blood pressure").
    await expect(
      programDefinitionSchema.parseAsync({
        title: 'NCD Follow-up Review',
        surveys: [{ code: 'ncdreview', name: 'NCD Follow-up Review' }],
        surveySheets: [
          {
            surveyName: 'NCD Follow-up Review',
            questions: [{ code: 'ncdreview010', text: 'Blood pressure', type: 'Number' }],
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it('normalizes generated Excel-style calculations to math.js expressions', () => {
    expect(
      sanitizeProgramDefinitionPreview({
        title: 'NCD Follow-up Review',
        surveys: [
          {
            code: 'ncdreview',
            name: 'NCD Follow-up Review',
          },
        ],
        surveySheets: [
          {
            surveyName: 'NCD Follow-up Review',
            questions: [
              {
                code: 'ncdreview010',
                name: 'ncdreview010',
                text: 'Total score',
                type: 'CalculatedQuestion',
                calculation: '=SUM(ncdreview001, ncdreview002)',
              },
            ],
          },
        ],
      }).surveySheets[0].questions[0].calculation,
    ).toBe('SUM(ncdreview001, ncdreview002)');
  });
});
