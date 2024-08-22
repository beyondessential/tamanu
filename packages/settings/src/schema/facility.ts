import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
  values: {
    templates: {
      values: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          values: {
            title: {
              name: 'Letterhead title',
              description: '_',
              schema: yup.string().nullable(),
              defaultValue: null,
            },
            subTitle: {
              name: 'Letterhead subtitle',
              description: '_',
              schema: yup.string().nullable(),
              defaultValue: null,
            },
          },
        },
      },
    },
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      values: {
        defaults: {
          name: 'Defaults',
          description: '_',
          values: {
            locationGroupId: {
              name: 'Location group',
              description: '_',
              schema: yup
                .string()
                .nullable()
                .strict(true),
              defaultValue: null,
            },
            locationId: {
              name: 'Location',
              description: '_',
              schema: yup
                .string()
                .nullable()
                .strict(true),
              defaultValue: null,
            },
            departmentId: {
              name: 'Department',
              description: '_',
              schema: yup
                .string()
                .nullable()
                .strict(true),
              defaultValue: null,
            },
          },
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
