import * as yup from 'yup';

import { datelessTimeStringSchema, letterheadProperties } from './definitions';
import { durationStringSchema } from './global';
import { extractDefaults } from './utils';

export const facilitySettings = {
  name: 'Facility server settings',
  description: 'Settings that apply only to a facility server',
  properties: {
    appointments: {
      description: 'Settings related to scheduling patient appointments and location bookings',
      properties: {
        bookingSlots: {
          description: 'Configure the available booking slots for appointments',
          properties: {
            startTime: {
              description:
                'The time when bookings open for the day. (The earliest start time for a booking.) Uses 24-hour time, e.g. 13:30.',
              type: datelessTimeStringSchema,
              defaultValue: '09:00',
            },
            endTime: {
              description:
                'The time when bookings close for the day. (The latest booking must end by this time.) Uses 24-hour time, e.g. 13:30.',
              type: datelessTimeStringSchema,
              defaultValue: '17:00',
            },
            slotDuration: {
              description:
                'The length of each time slot. A single booking may span multiple consecutive slots. Supported units: ‘min’, ‘h’',
              type: durationStringSchema,
              defaultValue: '30min',
            },
          },
        },
      },
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
    templates: {
      description: 'Text to be inserted into emails/PDFs',
      properties: {
        letterhead: {
          description: 'The text at the top of most patient PDFs',
          properties: letterheadProperties,
        },
      },
    },
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      type: yup.object(),
      defaultValue: {},
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
