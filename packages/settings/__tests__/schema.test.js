import { validateSettings, globalDefaults, centralDefaults, facilityDefaults } from '../dist/mjs';
import { extractDefaults } from '../dist/cjs/schema/utils';
import * as yup from 'yup';
import { fail } from 'assert';
import { VACCINE_STATUS } from '@tamanu/constants';

describe('Schemas', () => {
  describe('Extracting settings from schema', () => {
    it('Should extract settings from a schema', () => {
      const schema = {
        properties: {
          a: {
            properties: {
              b: {
                name: 'Setting a.b',
                description: '_',
                type: yup.boolean().required(),
                defaultValue: false,
              },
            },
          },
          c: {
            name: 'Setting c',
            type: yup.string().required(),
            defaultValue: 'c',
          },
          d: {
            properties: {
              e: {
                properties: {
                  f: {
                    name: 'Setting d.e.f',
                    type: yup
                      .array()
                      .of(
                        yup.object({
                          threshold: yup.number().required(),
                          status: yup.string().required(),
                        }),
                      )
                      .required(),
                    defaultValue: [
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
              status: VACCINE_STATUS.SCHEDULED,
            },
            {
              threshold: 7,
              status: VACCINE_STATUS.UPCOMING,
            },
            {
              threshold: -7,
              status: VACCINE_STATUS.DUE,
            },
            {
              threshold: -55,
              status: VACCINE_STATUS.OVERDUE,
            },
            {
              threshold: '-Infinity',
              status: VACCINE_STATUS.MISSED,
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
      ).rejects.toThrow(yup.ValidationError);
    });

    // Temporarily skip test for feature testing
    it.skip('Should warn for unknown fields', async () => {
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

      try {
        await validateSettings({ settings: unknownSettings, scope: 'global' });
        fail('Expected validation to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(yup.ValidationError);

        if (error instanceof yup.ValidationError) {
          const errorTypes = error.inner.map(err => err.type);
          expect(errorTypes.length).toBe(1);
          expect(errorTypes).toContain('noUnknown');
        }
      }
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
        vaccinations: {},
      };

      await expect(
        validateSettings({ settings: validSettings, scope: 'facility' }),
      ).resolves.not.toThrow();
    });

    it('Should throw error for invalid settings', async () => {
      const invalidSettings = {
        templates: {
          letterhead: {},
        },
        sync: {
          syncAllLabRequests: 'a',
        },
      };

      await expect(
        validateSettings({ settings: invalidSettings, scope: 'facility' }),
      ).rejects.toThrow(yup.ValidationError);
    });

    // Temporarily skip test for feature testing
    it.skip('Should warn for unknown fields', async () => {
      const unknownSettings = {
        vaccinations: {},
        a: {
          b: {
            c: 'c',
          },
        },
        unknownField: 'value',
      };

      try {
        await validateSettings({ settings: unknownSettings, scope: 'facility' });
        fail('Expected validation to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(yup.ValidationError);

        if (error instanceof yup.ValidationError) {
          const errorTypes = error.inner.map(err => err.type);
          expect(errorTypes.length).toBe(1);
          expect(errorTypes).toContain('noUnknown');
        }
      }
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
        properties: {
          a: {
            type: yup.string().required(),
            defaultValue: 'a',
          },
        },
      };

      const settings = {
        a: null,
      };

      await expect(validateSettings({ settings, schema })).rejects.toThrow(yup.ValidationError);
    });
  });

  it('Should work with simple arrays', async () => {
    const schema = {
      properties: {
        a: {
          type: yup.array().of(yup.string()),
          defaultValue: ['a'],
        },
      },
    };

    const settings = {
      a: ['b', 'c'],
    };

    await expect(validateSettings({ settings, schema })).resolves.not.toThrow();
  });

  it('Should work with arrays of objects', async () => {
    const schema = {
      properties: {
        a: {
          type: yup.array().of(
            yup.object().shape({
              b: yup.string().required(),
            }),
          ),
          defaultValue: [{ b: 'a' }],
        },
      },
    };

    const settings = {
      a: [{ b: 'c' }, { b: 'd' }],
    };

    await expect(validateSettings({ settings, schema })).resolves.not.toThrow();
  });
});
