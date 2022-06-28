import { validateRecordSet } from '../app/admin/validateRecordSet';

describe('validateRecordSet', () => {
  it('should check for duplicate records', async () => {
    const records = [
      {
        sheet: 'allergies',
        row: 2,
        recordType: 'allergy',
        data: {
          id: 'allergy-peanuts',
          code: 'peanuts',
          name: 'Peanuts',
        },
      },
      {
        sheet: 'allergies',
        row: 3,
        recordType: 'allergy',
        data: {
          id: 'allergy-peanuts',
          code: 'peanuts',
          name: 'Peanuts',
        },
      },
    ];
    const results = await validateRecordSet(records);
    expect(results.errors).toEqual([
      {
        ...records[1],
        errors: ['id allergy-peanuts is already being used at allergies:2'],
      },
    ]);
  });
  it('should include dependent records', async () => {
    const records = [
      {
        sheet: 'facilities',
        row: 2,
        recordType: 'facility',
        data: {
          id: 'facility-TamanuHealthCentre',
          code: 'TamanuHealthCentre',
          name: 'Tamanu Health Centre',
        },
      },
    ];
    const results = await validateRecordSet(records);
    expect(results.errors).toEqual([
      {
        ...records[0],
        errors: ['record has no department'],
      },
    ]);
  });
});
