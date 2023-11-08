import { format } from 'date-fns';
import { FHIR_DATETIME_PRECISION } from '@tamanu/constants/fhir';
import { InvalidParameterError, Exception } from '@tamanu/shared/errors';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';
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

  describe('formatFhirDate', () => {
    it('Returns undefined when date is undefined', () => {
      const formattedFhirDate = formatFhirDate();
      expect(formattedFhirDate).toBe(undefined);
    });

    it('Returns null when date is null', () => {
      const formattedFhirDate = formatFhirDate(null);
      expect(formattedFhirDate).toBe(null);
    });

    it('Returns a string when a date is passed', () => {
      const dateValue = new Date();
      const formattedFhirDate = formatFhirDate(dateValue);
      expect(typeof formattedFhirDate).toBe('string');
    });

    it('Parses date string', () => {
      const dateValue = '2020-05-10';
      const formattedFhirDate = formatFhirDate(dateValue);
      expect(formattedFhirDate).toBeTruthy();
    });

    it('Parses date time string', () => {
      const dateValue = '2020-05-10 14:30:01';
      const formattedFhirDate = formatFhirDate(dateValue);
      expect(formattedFhirDate).toBeTruthy();
    });

    it('Parses date objects', () => {
      const dateValue = new Date('2020-05-10 14:30:01');
      const formattedFhirDate = formatFhirDate(dateValue);
      expect(formattedFhirDate).toBeTruthy();
    });

    it('Should default precision to seconds with timezone', () => {
      const dateValue = new Date('2020-05-10 14:30:01');
      const expectedValue = format(dateValue, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const formattedFhirDate = formatFhirDate(dateValue);
      expect(formattedFhirDate).toBe(expectedValue);
    });

    it('Should work with different levels of precision', () => {
      const dateValue = new Date('2020-05-10 14:30:01');
      const expectedValue = format(dateValue, 'yyyy-MM-dd');
      const formattedFhirDate = formatFhirDate(dateValue, FHIR_DATETIME_PRECISION.DAYS);
      expect(formattedFhirDate).toBe(expectedValue);
    });

    it('Throws an exception when the format is not valid for FHIR', () => {
      const dateValue = new Date('2020-05-10 14:30:01');
      const faultyFormatted = () => formatFhirDate(dateValue, FHIR_DATETIME_PRECISION.MINUTES);
      expect(faultyFormatted).toThrow(Exception);
    });

    it('Throws an exception when the specified format is not known', () => {
      const dateValue = new Date('2020-05-10 14:30:01');
      const faultyFormatted = () => formatFhirDate(dateValue, 'gibberish-format');
      expect(faultyFormatted).toThrow(Exception);
    });
  });
});
