import { describe, expect, test } from 'vitest';
import { replaceStringVariables } from '../../app/contexts/Translation';

describe('replaceStringVariables', () => {
  test.each([
    {
      testTitle: 'Basic string',
      inputString: 'basic string',
      result: 'basic string',
    },
    {
      testTitle: 'Single replacement',
      inputString: 'single replacement :foo',
      replacements: { foo: 'bar' },
      result: 'single replacement bar',
    },
    {
      testTitle: 'Multiple replacements',
      inputString: 'multiple replacements :a :b',
      replacements: { a: 'one', b: 'two' },
      result: 'multiple replacements one two',
    },
    {
      testTitle: 'Multiple integer replacements',
      inputString: 'multiple replacements :a :b',
      replacements: { a: 1, b: 2 },
      result: 'multiple replacements 1 2',
    },
    {
      testTitle: 'Slots with no replacements',
      inputString: 'replacements are missing :here and :there',
      result: 'replacements are missing :here and :there',
    },
    {
      testTitle: 'Too many replacements',
      inputString: 'replacements are :here',
      replacements: { here: 'one', there: 'two' },
      result: 'replacements are one',
    },
    {
      testTitle: 'Replacements with no slots',
      inputString: 'basic string',
      replacements: { a: 'one', b: 'two' },
      result: 'basic string',
    },
    {
      testTitle: 'Too many slots',
      inputString: 'replacements are missing :here but not :there',
      replacements: { there: 'one' },
      result: 'replacements are missing :here but not one',
    },
  ])('$testTitle', ({ inputString, replacements, result }) => {
    expect(replaceStringVariables(inputString, { replacements })).toBe(result);
  });
});
