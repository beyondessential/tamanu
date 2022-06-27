import { InvalidParameterError } from 'shared/errors';
import { createTestContext } from '../utilities';

import { hl7SortToTamanu } from '../../app/hl7fhir/utils';
import { sortableHL7PatientFields } from '../../app/hl7fhir/hl7PatientFields';

describe('HL7FHIR module utils', () => {
  let models;
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('hl7SortToTamanu', () => {
    it('Allows -issued (descending) sort for DiagnosticReport', () => {
      const tamanuSort = hl7SortToTamanu('-issued', 'LabTest');
      expect(tamanuSort).toEqual([
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ]);
    });

    it('Allows issued (ascending) sort for DiagnosticReport', () => {
      const tamanuSort = hl7SortToTamanu('issued', 'LabTest');
      expect(tamanuSort).toEqual([
        ['createdAt', 'ASC'],
        ['id', 'DESC'],
      ]);
    });

    it('Throws an error if a parameter is unrecognized/unsupported', () => {
      ['subject', 'result', 'given,status', 'something, misguided'].forEach(sort => {
        expect(() => hl7SortToTamanu(sort, 'Patient')).toThrow(InvalidParameterError);
      });
    });

    it('Correctly handles supported Patient parameters that are sortable', () => {
      [...sortableHL7PatientFields, 'given,family,birthdate'].forEach(sort => {
        const tamanuSort = hl7SortToTamanu(sort, 'Patient');
        expect(Array.isArray(tamanuSort)).toBe(true);
        tamanuSort.forEach(item => {
          expect(Array.isArray(item)).toBe(true);
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
