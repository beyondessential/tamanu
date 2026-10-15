import { describe, expect, it } from 'vitest';
import { expandRoute, isRouteDescriptor, route } from '../src/route';

describe('route', () => {
  it('bundles the template verbatim with its params', () => {
    const descriptor = route('patient/:patientId/allergies', { patientId: 'abc' });
    expect(descriptor.template).toBe('patient/:patientId/allergies');
    expect(descriptor.params).toEqual({ patientId: 'abc' });
    expect(isRouteDescriptor(descriptor)).toBe(true);
  });

  it('does not treat a plain string as a descriptor', () => {
    expect(isRouteDescriptor('patient/:patientId/allergies')).toBe(false);
    expect(isRouteDescriptor({ template: 'x', params: {} })).toBe(false);
    expect(isRouteDescriptor(null)).toBe(false);
  });
});

describe('expandRoute', () => {
  it('expands placeholders into the concrete path', () => {
    const path = expandRoute(route('patient/:patientId/allergies', { patientId: 'abc' }));
    expect(path).toBe('patient/abc/allergies');
  });

  it('expands multiple placeholders', () => {
    const path = expandRoute(
      route('patient/:patientId/allergies/:allergyId', {
        patientId: 'abc',
        allergyId: 'def',
      }),
    );
    expect(path).toBe('patient/abc/allergies/def');
  });

  it('URL-encodes each value centrally', () => {
    const path = expandRoute(route('referenceData/:id', { id: 'village-Nasaga/sub' }));
    expect(path).toBe('referenceData/village-Nasaga%2Fsub');
  });

  it('stringifies and encodes numeric values', () => {
    const path = expandRoute(route('encounter/:encounterId', { encounterId: 42 }));
    expect(path).toBe('encounter/42');
  });

  it('keeps a literal multi-segment prefix intact and only encodes the param', () => {
    // A base path belongs in the template literal, not as a param, so its slashes
    // stay literal while the trailing id is encoded.
    const base = 'admin/referenceData/manage';
    expect(expandRoute(route(`${base}/:id`, { id: 'xyz-1' }))).toBe(
      'admin/referenceData/manage/xyz-1',
    );
  });

  it('encodes a slash inside a single param value (why a base path must not be a param)', () => {
    expect(expandRoute(route('referenceData/:id', { id: 'a/b' }))).toBe('referenceData/a%2Fb');
  });

  it('leaves a template with no placeholders untouched', () => {
    const path = expandRoute(route('user/me'));
    expect(path).toBe('user/me');
  });

  it('throws when a placeholder has no value', () => {
    // @ts-expect-error - deliberately missing the required param
    expect(() => expandRoute(route('patient/:patientId/allergies', {}))).toThrow(
      /no value for :patientId/,
    );
  });

  it('throws when a value has no matching placeholder', () => {
    const descriptor = {
      ...route('patient/:patientId', { patientId: 'abc' }),
      params: { patientId: 'abc', stray: 'x' },
    };
    expect(() => expandRoute(descriptor)).toThrow(/\[stray\] are not present/);
  });
});
