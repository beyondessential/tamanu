import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSettings } from '../../../../src/routes/fhir/utils';
import { log } from '../../../../src/services/logging';

const reader = name => ({ name, get: async () => undefined });

describe('resolveSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('falls back to the global reader without warning when the request has no facility', () => {
    const warn = vi.spyOn(log, 'warn');
    const settings = { 'facility-a': reader('a'), global: reader('global') };
    expect(resolveSettings({ settings })).toBe(settings.global);
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to the global reader with a warning when the facility has no reader', () => {
    const warn = vi.spyOn(log, 'warn');
    const settings = { 'facility-a': reader('a'), global: reader('global') };
    expect(resolveSettings({ settings, facilityId: 'facility-b' })).toBe(settings.global);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('using global settings'),
      expect.objectContaining({ facilityId: 'facility-b' }),
    );
  });
});
