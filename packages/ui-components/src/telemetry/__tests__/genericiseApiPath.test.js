import { describe, it, expect } from 'vitest';

import { genericiseApiPath } from '../genericiseApiPath';

describe('genericiseApiPath', () => {
  it('keeps word segments and masks a uuid segment', () => {
    const { route, pathParams } = genericiseApiPath(
      'encounter/0f8fad5b-d9cb-469f-a165-70867728950e/notes',
    );
    expect(route).toBe('encounter/:param1/notes');
    expect(pathParams).toEqual({ param1: '0f8fad5b-d9cb-469f-a165-70867728950e' });
  });

  it('masks numeric and long opaque id segments', () => {
    const numeric = genericiseApiPath('labTest/12345');
    expect(numeric.route).toBe('labTest/:param1');
    expect(numeric.pathParams).toEqual({ param1: '12345' });

    const opaque = genericiseApiPath('referenceData/abcdef0123456789XYZ');
    expect(opaque.route).toBe('referenceData/:param1');
    expect(opaque.pathParams).toEqual({ param1: 'abcdef0123456789XYZ' });
  });

  it('numbers multiple masked segments in order', () => {
    const { route, pathParams } = genericiseApiPath(
      'patients/0f8fad5b-d9cb-469f-a165-70867728950e/encounter/7c9e6679-7425-40de-944b-e07fc1f90ae7',
    );
    expect(route).toBe('patients/:param1/encounter/:param2');
    expect(pathParams).toEqual({
      param1: '0f8fad5b-d9cb-469f-a165-70867728950e',
      param2: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    });
  });

  it('preserves a leading slash and strips the query string', () => {
    const { route, pathParams } = genericiseApiPath('/patients?displayName=Smith');
    expect(route).toBe('/patients');
    expect(pathParams).toEqual({});
  });

  it('returns a route with no params for a plain path', () => {
    const { route, pathParams } = genericiseApiPath('dashboard');
    expect(route).toBe('dashboard');
    expect(pathParams).toEqual({});
  });
});
