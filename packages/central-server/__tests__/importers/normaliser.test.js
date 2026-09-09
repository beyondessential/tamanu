import { describe, expect, it } from 'vitest';
import { normaliseSheetName } from '../../app/admin/importer/importerEndpoint';

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

  it('should normalise special case for programRegistryClinicalStatus', () => {
    const name = normaliseSheetName('Registry', 'ProgramRegistryClinicalStatus');
    expect(name).toEqual('programRegistryClinicalStatus');
  });

  it('should normalise the shortened export tab name for medicationDispenseModifyReason', () => {
    // The exported tab name is shortened to fit Excel's 31 character sheet name limit
    // (see DefaultDataExporter's CUSTOM_TAB_NAMES) so this mapping must be kept in sync with it.
    const name = normaliseSheetName('Medication Dispense Mod Reason');
    expect(name).toEqual('medicationDispenseModifyReason');
  });
});
