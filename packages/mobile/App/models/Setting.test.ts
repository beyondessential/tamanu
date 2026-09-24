import { Database } from '~/infra/db';
import { writeConfig } from '~/services/config';
import { SETTINGS_SCOPES } from '~/constants';
import { Setting } from './Setting';
import type { Facility } from './Facility';

// Setting.getByKey is the mobile app's only read of the synced `settings` table. These tests run
// against real SQLite to pin down that it reads just the requested subtree for this device, and
// that a facility value replaces the global one outright (arrays included) rather than being
// deep-merged, which is how the server's settings cascade resolves overrides too.
describe('Setting.getByKey', () => {
  let facilityId: string;
  let otherFacilityId: string;

  const seedSetting = (key: string, value: unknown, facility: string | null = null) =>
    Database.models.Setting.createAndSaveOne({
      key,
      value: JSON.stringify(value),
      scope: facility ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.GLOBAL,
      facility,
    });

  beforeAll(async () => {
    await Database.connect();

    const facility = await Database.models.Facility.createAndSaveOne<Facility>({
      name: 'This Facility',
    });
    facilityId = facility.id;
    const otherFacility = await Database.models.Facility.createAndSaveOne<Facility>({
      name: 'Other Facility',
    });
    otherFacilityId = otherFacility.id;
  });

  beforeEach(async () => {
    await writeConfig('facilityId', facilityId);
    await Database.models.Setting.clear();
  });

  it('throws when no key is given', async () => {
    await expect(Setting.getByKey('')).rejects.toThrow();
  });

  it('returns undefined when nothing matches', async () => {
    await seedSetting('features.enabled', true);
    expect(await Setting.getByKey('features.missing')).toBeUndefined();
  });

  it('returns the parsed value of a leaf key', async () => {
    await seedSetting('features.reminderContactModule.enabled', true);
    await seedSetting('sync.urgentIntervalInSeconds', 30);
    await seedSetting('vaccinations.defaults', { locationId: 'loc-1' });
    await seedSetting('plainString', 'not json');

    expect(await Setting.getByKey('features.reminderContactModule.enabled')).toBe(true);
    expect(await Setting.getByKey('sync.urgentIntervalInSeconds')).toBe(30);
    expect(await Setting.getByKey('vaccinations.defaults')).toEqual({ locationId: 'loc-1' });
    expect(await Setting.getByKey('plainString')).toBe('not json');
  });

  it('returns only the requested subtree as a nested object', async () => {
    await seedSetting('vaccinations.defaults.locationId', 'loc-1');
    await seedSetting('vaccinations.defaults.departmentId', 'dept-1');
    await seedSetting('vaccinations.other', 'ignored');
    await seedSetting('features.enabled', true);

    expect(await Setting.getByKey('vaccinations.defaults')).toEqual({
      locationId: 'loc-1',
      departmentId: 'dept-1',
    });
  });

  it('does not match sibling keys that merely share a prefix', async () => {
    await seedSetting('features.x', 'x');
    await seedSetting('features.xy', 'xy');
    await seedSetting('features.xy.z', 'z');

    expect(await Setting.getByKey('features.x')).toBe('x');
  });

  it('lets a facility value override the global value', async () => {
    await seedSetting('features.enabled', false);
    await seedSetting('features.enabled', true, facilityId);

    expect(await Setting.getByKey('features.enabled')).toBe(true);
  });

  it('replaces an array rather than merging it element-wise', async () => {
    await seedSetting('medications.frequenciesEnabled', ['a', 'b', 'c']);
    await seedSetting('medications.frequenciesEnabled', ['z'], facilityId);

    expect(await Setting.getByKey('medications.frequenciesEnabled')).toEqual(['z']);
  });

  it('combines global and facility rows within a subtree', async () => {
    await seedSetting('vaccinations.defaults.locationId', 'global-loc');
    await seedSetting('vaccinations.defaults.departmentId', 'global-dept');
    await seedSetting('vaccinations.defaults.locationId', 'facility-loc', facilityId);

    expect(await Setting.getByKey('vaccinations.defaults')).toEqual({
      locationId: 'facility-loc',
      departmentId: 'global-dept',
    });
  });

  it('ignores rows belonging to another facility', async () => {
    await seedSetting('features.enabled', false);
    await seedSetting('features.enabled', true, otherFacilityId);
    await seedSetting('features.onlyElsewhere', true, otherFacilityId);

    expect(await Setting.getByKey('features.enabled')).toBe(false);
    expect(await Setting.getByKey('features.onlyElsewhere')).toBeUndefined();
  });

  it('uses only global rows when the device has no facility assigned', async () => {
    await writeConfig('facilityId', '');
    await seedSetting('features.enabled', false);
    await seedSetting('features.enabled', true, facilityId);

    expect(await Setting.getByKey('features.enabled')).toBe(false);
  });
});
