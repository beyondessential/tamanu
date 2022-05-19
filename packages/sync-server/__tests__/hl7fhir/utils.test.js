import { createTestContext } from '../utilities';

import { hl7SortToTamanu, sortableHL7PatientFields } from '../../app/hl7fhir/utils';

describe('HL7FHIR module utils', () => {
  let models;
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('hl7SortToTamanu', () => {
    it('Allows -issued sort for DiagnosticReport', () => {
      const tamanuSort = hl7SortToTamanu('-issued', 'LabTest');
      expect(tamanuSort).toEqual([
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ]);

      ['identifier', 'issued', '-issued,identifier'].forEach(sort => {
        expect(() => hl7SortToTamanu(sort, 'LabTest')).toThrow();
      });
    });

    it('Throws an error if a parameter is unrecognized/unsupported', () => {
      ['subject', 'result', 'given,status', 'something, misguided'].forEach(sort => {
        expect(() => hl7SortToTamanu(sort, 'Patient')).toThrow();
      });
    });

    it('Correctly handles supported Patient parameters that are sortable', () => {
      [...sortableHL7PatientFields, 'given,family,birthdate'].forEach(sort => {
        const tamanuSort = hl7SortToTamanu(sort, 'Patient');
        expect(Array.isArray(tamanuSort)).toBe(true);
        tamanuSort.forEach(item => {
          expect(item).toMatchObject([expect.any(String), expect.any(String)]);
        });
      });
    });

    it('Returns a valid sequelize order clause', async () => {
      const tamanuSort = hl7SortToTamanu('given,-issued', 'Patient');
      expect(tamanuSort).toEqual([
        ['firstName', 'ASC'],
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ]);

      const result = await models.Patient.findAll({
        where: {
          firstName: 'xyz yxz',
        },
        order: tamanuSort,
      });

      // If sequelize doesn't throw an error, assume sort is valid
      expect(result).toBeTruthy();
    });
  });
});
