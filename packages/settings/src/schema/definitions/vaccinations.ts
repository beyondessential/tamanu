import * as yup from 'yup';

export const vaccinationsSchema = {
  name: 'Vaccinations',
  description: '_',
  exposedToWeb: true,
  properties: {
    defaults: {
      description: '_',
      properties: {
        locationGroupId: {
          name: 'Location group',
          description: '_',
          type: yup.string().nullable(),
          defaultValue: null,
        },
        locationId: {
          name: 'Location',
          description: '_',
          type: yup.string().nullable(),
          defaultValue: null,
        },
        departmentId: {
          name: 'Department',
          description: '_',
          type: yup.string().nullable(),
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
              type: yup.string().nullable(),
              defaultValue: null,
            },
            locationId: {
              name: 'Location',
              description: '_',
              type: yup.string().nullable(),
              defaultValue: null,
            },
            departmentId: {
              name: 'Department',
              description: '_',
              type: yup.string().nullable(),
              defaultValue: null,
            },
          },
        },
      },
    },
  },
};
