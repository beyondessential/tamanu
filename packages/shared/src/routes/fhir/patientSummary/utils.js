import { escape } from 'lodash';
import { VACCINE_STATUS } from '@tamanu/constants';

export const escapeHtml = str => (str ? escape(str) : '');

export const getPatientDisplayName = patient =>
  [patient.firstName, patient.lastName].filter(x => x).join(' ');

export const getEntryResourceSubject = patient => ({
  reference: `urn:uuid:${patient.id}`,
  display: getPatientDisplayName(patient),
});

export const getBundleEntryFromResource = resource => ({
  fullUrl: `urn:uuid:${resource.id}`,
  resource,
});

export function administeredVaccineStatusToHL7Status(status) {
  switch (status) {
    case VACCINE_STATUS.GIVEN:
      return 'completed';
    case VACCINE_STATUS.RECORDED_IN_ERROR:
      return 'entered-in-error';
    case VACCINE_STATUS.NOT_GIVEN:
    case VACCINE_STATUS.SCHEDULED:
    case VACCINE_STATUS.MISSED:
    case VACCINE_STATUS.DUE:
    case VACCINE_STATUS.UPCOMING:
    case VACCINE_STATUS.OVERDUE:
    case VACCINE_STATUS.UNKNOWN:
      return 'not-done';
    default:
      throw new Error(`Unknown administered vaccine status: ${status}`);
  }
}
