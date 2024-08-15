import { validateSettings } from '../dist/mjs';

describe('Schemas', () => {
  let warnSpy;

  beforeAll(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Global settings', () => {
    it('Should validate valid settings', async () => {
      const validSettings = {
        customisations: {
          componentVersions: {},
        },
        fhir: {
          worker: {
            heartbeat: '1 minute',
            assumeDroppedAfter: '10 minutes',
          },
        },
        integrations: {
          imaging: {
            enabled: false,
          },
        },
        upcomingVaccinations: {
          ageLimit: 15,
          thresholds: [
            {
              threshold: 28,
              status: 'scheduled',
            },
            {
              threshold: 7,
              status: 'upcoming',
            },
            {
              threshold: -7,
              status: 'due',
            },
            {
              threshold: -55,
              status: 'overdue',
            },
            {
              threshold: '-Infinity',
              status: 'missed',
            },
          ],
        },
        features: {
          mandateSpecimenType: false,
        },
      };

      await expect(
        validateSettings({ settings: validSettings, scope: 'global' }),
      ).resolves.not.toThrow();
    });

    it('Should throw error for invalid settings', async () => {
      const invalidSettings = {
        integrations: {
          imaging: {
            enabled: false,
          },
        },
        features: {
          mandateSpecimenType: 'a',
        },
      };

      await expect(
        validateSettings({ settings: invalidSettings, scope: 'global' }),
      ).rejects.toThrow(/Validation failed for the following fields/);
    });

    it('Should warn for unknown fields', async () => {
      const unknownSettings = {
        integrations: {
          imaging: {
            enabled: false,
          },
        },
        features: {
          mandateSpecimenType: false,
        },
        a: {
          b: {
            c: true,
          },
        },
        d: 'value',
      };

      await validateSettings({ settings: unknownSettings, scope: 'global' });

      expect(warnSpy).toHaveBeenCalledWith('Unknown setting: a.b.c');
      expect(warnSpy).toHaveBeenCalledWith('Unknown setting: d');
    });
  });

  describe('Central settings', () => {
    it('Should validate valid settings', () => {
      // No current validation for central settings
    });
  });

  describe('Facility settings', () => {
    it('Should validate valid settings', async () => {
      const validSettings = {
        templates: {
          letterhead: {},
        },
        vaccinations: {},
      };

      await expect(
        validateSettings({ settings: validSettings, scope: 'facility' }),
      ).resolves.not.toThrow();
    });

    it('Should throw error for invald settings', async () => {
      const invalidSettings = {
        templates: {
          letterhead: {},
        },
        vaccinations: false,
      };

      await expect(
        validateSettings({ settings: invalidSettings, scope: 'facility' }),
      ).rejects.toThrow(/Validation failed for the following fields/);
    });

    it('Should warn for unknown fields', async () => {
      const unknownSettings = {
        templates: {
          letterhead: {},
        },
        vaccinations: {},
        a: {
          b: {
            c: 'c',
          },
        },
        unknownField: 'value',
      };

      await validateSettings({ settings: unknownSettings, scope: 'facility' });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown setting: unknownField'),
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown setting: a.b.c'));
    });
  });
});
