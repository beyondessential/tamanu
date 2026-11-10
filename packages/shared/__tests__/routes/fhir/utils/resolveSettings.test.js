import { describe, expect, it } from 'vitest';
import { resolveSettings } from '../../../../src/routes/fhir/utils';

const reader = name => ({ name, get: async () => undefined });

describe('resolveSettings', () => {
  it('returns undefined when the request has no settings', () => {
    expect(resolveSettings({})).toBeUndefined();
  });

  it('returns a single reader as-is (central server)', () => {
    const settings = reader('central');
    expect(resolveSettings({ settings })).toBe(settings);
  });

  it("returns the request facility's reader on a facility server", () => {
    const settings = { 'facility-a': reader('a'), global: reader('global') };
    expect(resolveSettings({ settings, facilityId: 'facility-a' })).toBe(settings['facility-a']);
  });

  it('falls back to the global reader when the request has no facility', () => {
    const settings = { 'facility-a': reader('a'), global: reader('global') };
    expect(resolveSettings({ settings })).toBe(settings.global);
  });

  it('falls back to the global reader when the facility is not served here', () => {
    const settings = { 'facility-a': reader('a'), global: reader('global') };
    expect(resolveSettings({ settings, facilityId: 'facility-b' })).toBe(settings.global);
  });
});
