import { describe, expect, it } from 'vitest';
import { SSCCalculatedQuestion, SSCPatientIssue } from '../../app/admin/importSchemas';

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

  describe('calculations', () => {
    const calculatedQuestion = calculation => ({
      id: 'survey-calculated',
      surveyId: 'survey',
      dataElementId: 'pde-calculated',
      screenIndex: 0,
      componentIndex: 0,
      calculation,
    });

    it.each(['A + B', 'round((A + B) / 2, 1)', 'A > 5 ? max(A, B) : 0', 'sum(A, B, C) * pi'])(
      'accepts %s',
      async calculation => {
        await expect(
          SSCCalculatedQuestion.validate(calculatedQuestion(calculation)),
        ).resolves.toMatchObject({ calculation });
      },
    );

    it.each([
      ['1 + + / * 4', /not a valid calculation/],
      ['x = A', /Unsupported expression: AssignmentNode/],
      ['A.constructor', /Unsupported expression: AccessorNode/],
      ['evaluate("1")', /Unsupported function: evaluate/],
      ['A cm to mm', /Unsupported operator: to/],
    ])('rejects %s', async (calculation, message) => {
      await expect(SSCCalculatedQuestion.validate(calculatedQuestion(calculation))).rejects.toThrow(
        message,
      );
    });
  });
});
