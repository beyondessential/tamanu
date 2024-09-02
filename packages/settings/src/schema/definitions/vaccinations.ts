import { SettingsSchema } from 'schema/types';
import * as yup from 'yup';

export const vaccinationsSchema: SettingsSchema = {
  name: 'Vaccinations',
  description: '_',
  properties: {
    defaults: {
      name: 'Defaults',
      description: '_',
      properties: {
        locationGroupId: {
          name: 'Location group',
          description: '_',
          type: yup
            .string()
            .nullable()
            .strict(true),
          defaultValue: null,
        },
        locationId: {
          name: 'Location',
          description: '_',
          type: yup
            .string()
            .nullable()
            .strict(true),
          defaultValue: null,
        },
        departmentId: {
          name: 'Department',
          description: '_',
          type: yup
            .string()
            .nullable()
            .strict(true),
          defaultValue: null,
        },
      },
    },
    givenElsewhere: {
      properties: {
        defaults: {
          properties: {
            locationGroupId: {
              name: 'Location group',
              description: '_',
              type: yup
                .string()
                .nullable()
                .strict(true),
              defaultValue: null,
            },
            locationId: {
              name: 'Location',
              description: '_',
              type: yup
                .string()
                .nullable()
                .strict(true),
              defaultValue: null,
            },
            departmentId: {
              name: 'Department',
              description: '_',
              type: yup
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
