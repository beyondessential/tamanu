import * as yup from 'yup';
import { datelessTimeStringSchema } from './definitions';
import { durationStringSchema } from './global';
import { extractDefaults } from './utils';

export const facilitySettings = {
  name: 'Facility server settings',
  description: 'Settings that apply only to a facility server',
  properties: {
    bookingSlots: {
      description: 'Configure the available booking slots for appointments',
      properties: {
        startTime: {
          description:
            'The time when bookings open for the day. (The earliest start time for a booking.)',
          type: datelessTimeStringSchema,
          defaultValue: '09:00',
        },
        endTime: {
          description:
            'The time when bookings close for the day. (The latest booking must end by this time.)',
          type: datelessTimeStringSchema,
          defaultValue: '17:00',
        },
        slotDuration: {
          description:
            'The length of each time slot. A single booking may span multiple consecutive slots.',
          type: durationStringSchema,
          defaultValue: '30min',
        },
      },
    },
    templates: {
      name: 'Templates',
      description: 'Settings related to templates',
      properties: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      type: yup.object(),
      defaultValue: {},
    },
    survey: {
      name: 'Survey settings',
      description: '_',
      properties: {
        defaultCodes: {
          name: 'Default codes',
          description:
            'Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified',
          properties: {
            department: {
              name: 'Department',
              description: 'Default department code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
            location: {
              name: 'Location',
              description: 'Default location code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
          },
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
