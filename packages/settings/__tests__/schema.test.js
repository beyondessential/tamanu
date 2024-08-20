import { validateSettings, globalDefaults, centralDefaults, facilityDefaults } from '../dist/mjs';
import { extractDefaults } from '../dist/cjs/defaults/utils';
import * as yup from 'yup';

describe('Schemas', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Extracting settings from schema', () => {
    it('Should extract settings from a schema', () => {
      const schema = {
        a: {
          b: {
            name: 'Setting a.b',
            description: '_',
            schema: yup.boolean().required(),
            default: false,
          },
        },
        c: {
          name: 'Setting c',
          schema: yup.string().required(),
          default: 'c',
        },
        d: {
          e: {
            f: {
              name: 'Setting d.e.f',
              schema: yup
                .array()
                .of(
                  yup.object({
                    threshold: yup.number().required(),
                    status: yup.string().required(),
                  }),
                )
                .required(),
              default: [
                {
                  threshold: 28,
                  status: 'scheduled',
                },
                {
                  threshold: 7,
                  status: 'upcoming',
                },
              ],
            },
          },
        },
      };

      const expectedSettings = {
        a: {
          b: false,
        },
        c: 'c',
        d: {
          e: {
            f: [
              {
                threshold: 28,
                status: 'scheduled',
              },
              {
                threshold: 7,
                status: 'upcoming',
              },
            ],
          },
        },
      };

      expect(extractDefaults(schema)).toEqual(expectedSettings);
    });
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

    it('Should validate itself', async () => {
      await expect(
        validateSettings({ settings: globalDefaults, scope: 'global' }),
      ).resolves.not.toThrow();
    });
  });

  describe('Central settings', () => {
    it('Should validate valid settings', () => {
      // No current validation for central settings
    });

    it('Should validate itself', async () => {
      await expect(
        validateSettings({ settings: centralDefaults, scope: 'central' }),
      ).resolves.not.toThrow();
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

    it('Should validate itself', async () => {
      await expect(
        validateSettings({ settings: facilityDefaults, scope: 'facility' }),
      ).resolves.not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('Should prevent null values for non-nullable fields', async () => {
      const schema = {
        a: {
          schema: yup.string().required(),
          default: 'a',
        },
      };

      const settings = {
        a: null,
      };

      await expect(validateSettings({ settings, schema })).rejects.toThrow(
        /Validation failed for the following fields/,
      );
    });
  });

  it('Should work with simple arrays', async () => {
    const schema = {
      a: {
        schema: yup.array().of(yup.string()),
        default: ['a'],
      },
    };

    const settings = {
      a: ['b', 'c'],
    };

    await expect(validateSettings({ settings, schema })).resolves.not.toThrow();
  });

  it('Should work with arrays of objects', async () => {
    const schema = {
      a: {
        schema: yup.array().of(
          yup.object().shape({
            b: yup.string().required(),
          }),
        ),
        default: [{ b: 'a' }],
      },
    };

    const settings = {
      a: [{ b: 'c' }, { b: 'd' }],
    };

    await expect(validateSettings({ settings, schema })).resolves.not.toThrow();
  });
});
