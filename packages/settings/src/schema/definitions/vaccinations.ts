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
          description: 'The default location group pre-filled when recording a vaccination',
          type: yup.string().nullable(),
          defaultValue: null,
          suggesterEndpoint: 'locationGroup',
        },
        locationId: {
          name: 'Location',
          description: 'The default location pre-filled when recording a vaccination',
          type: yup.string().nullable(),
          defaultValue: null,
          suggesterEndpoint: 'location',
        },
        departmentId: {
          name: 'Department',
          description: 'The default department pre-filled when recording a vaccination',
          type: yup.string().nullable(),
          defaultValue: null,
          suggesterEndpoint: 'department',
        },
      },
    },
    givenElsewhere: {
      properties: {
        defaults: {
          properties: {
            locationGroupId: {
              name: 'Location group',
              description:
                'The default location group recorded against a vaccination given elsewhere',
              type: yup.string().nullable(),
              defaultValue: null,
              suggesterEndpoint: 'locationGroup',
            },
            locationId: {
              name: 'Location',
              description: 'The default location recorded against a vaccination given elsewhere',
              type: yup.string().nullable(),
              defaultValue: null,
              suggesterEndpoint: 'location',
            },
            departmentId: {
              name: 'Department',
              description: 'The default department recorded against a vaccination given elsewhere',
              type: yup.string().nullable(),
              defaultValue: null,
              suggesterEndpoint: 'department',
            },
          },
        },
      },
    },
  },
};
