import { Op } from 'sequelize';
import { ValidationError } from 'yup';
import { createTestContext } from '../utilities';

import {
  getExpressionsAndLogic,
  nestFilters,
  getFilterFromParam,
  hl7ParameterTypes,
} from '../../app/hl7fhir/utils';

describe('HL7FHIR module utils', () => {
  let models;
  let ctx;

  const testPrefixes = ['co', 'eq'];
  const testFields = {
    given: {
      parameterType: hl7ParameterTypes.string,
      fieldName: 'firstName',
      columnName: 'first_name',
      supportedPrefixes: testPrefixes,
    },
    family: {
      parameterType: hl7ParameterTypes.string,
      fieldName: 'lastName',
      columnName: 'last_name',
      supportedPrefixes: testPrefixes,
    },
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('getExpressionsAndLogic', () => {
    it('Should return an object containing two arrays', () => {
      const testCases = ['', 'given co jo', 'given co jo and family eq doe'];
      testCases.forEach((testStr, i) => {
        const testObj = getExpressionsAndLogic(testStr);

        // Only check for exact match on first test case, assume
        // that destructuring will suffice with the others.
        if (i === 0) {
          expect(testObj).toMatchObject({
            expressions: [''],
            logic: [],
          });
        }

        const { expressions, logic } = testObj;
        expect(Array.isArray(expressions)).toBe(true);
        expect(Array.isArray(logic)).toBe(true);
      });
    });

    it('Should return strings inside expressions array', () => {
      const testStr = 'given eq john and telecom eq 123456';
      const { expressions } = getExpressionsAndLogic(testStr);
      expressions.forEach(expression => {
        expect(typeof expression).toBe('string');
      });
    });

    it('Should return sequelize operators inside logic array', () => {
      const testStr = 'given eq john and family eq doe or telecom eq 123456';
      const { logic } = getExpressionsAndLogic(testStr);
      expect(logic).toMatchObject([Op.and, Op.or]);
    });

    it('Should correctly parse expressions', () => {
      const testCases = [
        {
          str: 'given eq "peter" and birthdate eq 2014-10-10',
          expressions: ['given eq "peter"', 'birthdate eq 2014-10-10'],
          logic: [Op.and],
        },
        {
          str: 'code eq http://loinc.org|1234-5',
          expressions: ['code eq http://loinc.org|1234-5'],
          logic: [],
        },
        {
          str: 'given co u and family co lar or telecom eq 123456',
          expressions: ['given co u', 'family co lar', 'telecom eq 123456'],
          logic: [Op.and, Op.or],
        },
        {
          str: 'name co "abc def" and telecom eq 123456',
          expressions: ['name co "abc def"', 'telecom eq 123456'],
          logic: [Op.and],
        },
        {
          str: 'name co "and or" or telecom eq 123456',
          expressions: ['name co "and or"', 'telecom eq 123456'],
          logic: [Op.or],
        },
      ];

      testCases.forEach(test => {
        const expectedObj = { expressions: test.expressions, logic: test.logic };
        const testObj = getExpressionsAndLogic(test.str);
        expect(testObj).toEqual(expectedObj);

        // Expressions should always have one more item than logic
        expect(testObj.expressions.length).toBe(testObj.logic.length + 1);
      });
    });
  });

  describe('nestFilters', () => {
    it('Should nest filters accordingly', () => {
      const filters = [
        { firstName: { [Op.substring]: 'jo' } },
        { lasttName: { [Op.substring]: 'do' } },
        { sex: { [Op.eq]: 'other' } },
        { dateOfBirth: { [Op.eq]: '1990-10-20' } },
        { primaryContactNumber: { [Op.eq]: '123456' } },
      ];
      const logic = [Op.and, Op.or, Op.or, Op.and];
      const testObj = nestFilters(filters, logic);
      // Use toEqual to check all deeply nested object chain
      expect(testObj).toEqual({
        [Op.and]: [
          filters[0],
          { [Op.or]: [filters[1], filters[2], { [Op.and]: [filters[3], filters[4]] }] },
        ],
      });
      expect(testObj[Op.and][1][Op.or][2][Op.and][1]).toBe(filters[4]);
    });

    it('Should throw an error if called with wrong params', () => {
      // Logic is empty
      expect(() => nestFilters([], [])).toThrow();

      // Disproportionate ammount of filters vs logic
      expect(() => nestFilters(['a'], ['a', 'b', 'c'])).toThrow();
    });
  });

  describe('getFilterFromParam', () => {
    it('Should get null if _filter is undefined', () => {
      const value = getFilterFromParam(undefined);
      expect(value).toBe(null);
    });

    it('Should return a valid sequelize where clause with one expression', async () => {
      const testStr = 'given eq zxy';
      const filter = getFilterFromParam(testStr, testFields);
      expect(filter).toEqual({
        firstName: { [Op.eq]: 'zxy' },
      });
      expect(filter.firstName[Op.eq]).toBe('zxy');

      // Look up something, if the where clause was invalid,
      // it would throw an error instead.
      const results = await models.Patient.findAll({ where: filter });
      expect(results).toBeTruthy();
    });

    it('Should return a valid sequelize where clause with more than one expression', async () => {
      const testStr = 'given eq zxy and family eq abc';
      const filter = getFilterFromParam(testStr, testFields);
      expect(filter).toEqual({
        [Op.and]: [{ firstName: { [Op.eq]: 'zxy' } }, { lastName: { [Op.eq]: 'abc' } }],
      });

      // Look up something, if the where clause was invalid,
      // it would throw an error instead.
      const results = await models.Patient.findAll({ where: filter });
      expect(results).toBeTruthy();
    });

    it('Should accept expressions with a quoted "value"', () => {
      const parameter = 'given';
      const prefix = 'co';
      // This is the referenced value. It should support being quoted.
      const value = '"pet"';
      const testStr = `${parameter} ${prefix} ${value}`;
      const filter = getFilterFromParam(testStr, testFields);
      expect(filter).toEqual({
        firstName: { [Op.substring]: 'pet' },
      });
      expect(filter.firstName[Op.substring]).toBe('pet');
    });

    it('Should throw a ValidationError if _filter contains unsupported or unknown expressions', () => {
      const testCases = ['', 'somethingbad', 'unsupported eq peter', 'given unsupported peter'];
      testCases.forEach(testStr => {
        expect(() => getFilterFromParam(testStr)).toThrow(ValidationError);
      });
    });
  });
});
