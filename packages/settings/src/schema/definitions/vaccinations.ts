import { SettingsSchema } from 'schema/types';
import * as yup from 'yup';

export const vaccinationsSchema: SettingsSchema = {
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
    givenElsewhere: {
      values: {
        defaults: {
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
