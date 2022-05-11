import { validateRecordSet } from '../app/admin/importerValidators';

describe('validateRecordSet', () => {
  it('should check for duplicate records', async () => {
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
      {
        sheet: 'facilities',
        row: 3,
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
        ...records[1],
        errors: ['id facility-TamanuHealthCentre is already being used at facilities:2'],
      },
    ]);
  });
});
