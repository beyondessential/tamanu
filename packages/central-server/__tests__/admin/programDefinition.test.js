import { normalizeQuestionConfigForImport } from '../../dist/admin/programImporter/programDefinition';

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
});
