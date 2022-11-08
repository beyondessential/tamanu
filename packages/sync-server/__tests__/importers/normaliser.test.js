import { normaliseSheetName } from '../../app/admin/importerEndpoint';

describe('Sheet name normaliser', () => {
  it('should normalise single words', () => {
    for (const [output, input] of Object.entries({
      // initial casing
      user: 'Users',
      // lowercase
      patient: 'patients',
      // all uppercase
      allergy: 'ALLERGIES',
      // weird plurals
      mouse: 'Mice',
      // already singular
      department: 'Department',
    })) {
      expect(normaliseSheetName(input)).toEqual(output);
    }
  });

  it('should normalise multiple words', () => {
    for (const [output, input] of Object.entries({
      // initial casing, ungendered+plural
      imagingType: 'Imaging Types',
      // lowercase, three words, two plurals
      labTestCategory: 'lab tests categories',
      // mixed case, three words, one plural
      labTestType: 'LAB Test types',
      // two words, already singular
      administeredVaccine: 'administered vaccine',
      // joined up, inner plural
      triageReason: 'TriagesReason',
    })) {
      expect(normaliseSheetName(input)).toEqual(output);
    }
  });

  it('should normalise special case scheduledVaccine', () => {
    for (const input of [
      // two words, already inverted
      'scheduled vaccine',

      // two words, usual order
      'Vaccine Schedules',

      // two words, both plural
      'Vaccines Schedules',

      // joined up, wrong plural
      'VaccinesSchedule',
    ]) {
      expect(normaliseSheetName(input)).toEqual('scheduledVaccine');
    }
  });
  it('should normalise special case for procedureTypes', () => {
    const name = normaliseSheetName('Procedures');
    expect(name).toEqual('procedureType');
  });
});
