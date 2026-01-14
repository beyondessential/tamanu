import { SEX_LABELS } from '@tamanu/constants';
import { format, startOfWeek, parseISO } from 'date-fns';
import type {
  Location,
  Appointment,
  OngoingPrescription,
  Patient,
  AdministeredVaccine,
} from '@tamanu/shared/schemas/patientPortal';

export const formatSex = (sex: Patient['sex'] | undefined) => {
  if (!sex) return '--';
  return SEX_LABELS[sex] || sex;
};

export const formatDisplayId = (displayId: string | undefined) => {
  return displayId || '--';
};

export const formatName = (name: string | null | undefined) => {
  return name || '--';
};

export const formatVillage = (village: Patient['village'] | null | undefined) => {
  return village?.name || '--';
};

// Medication-specific formatting functions
export const formatDose = (
  doseAmount: OngoingPrescription['doseAmount'],
  units: OngoingPrescription['units'],
) => {
  if (doseAmount === null || doseAmount === undefined || !units) return '--';
  return `${doseAmount} ${units}`;
};

export const formatFrequency = (frequency: OngoingPrescription['frequency']) => {
  if (!frequency) return '--';
  // This will be enhanced once we integrate with the translation system
  // For now, return the frequency as-is with basic formatting
  return frequency.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

export const formatRoute = (route: OngoingPrescription['route']) => {
  if (!route) return '--';
  // Basic route formatting - capitalize first letter
  return route.charAt(0).toUpperCase() + route.slice(1);
};

export const formatPrescriber = (prescriber: OngoingPrescription['prescriber']) => {
  return prescriber?.displayName || '--';
};

// Vaccination-specific formatting functions
export const formatVaccineGivenBy = (vaccine: AdministeredVaccine) => {
  if (vaccine.status === 'NOT_GIVEN') {
    return 'Not given';
  }
  if (vaccine.givenElsewhere) {
    return 'Given elsewhere';
  }
  return vaccine.givenBy || vaccine.recorder?.displayName || '--';
};

export const formatVaccineFacilityOrCountry = (vaccine: AdministeredVaccine) => {
  if (vaccine.givenElsewhere) {
    return vaccine.givenBy || '--';
  }
  return vaccine.location?.name || '--';
};

export const formatWeekOf = (dateString: string | null | undefined) => {
  if (!dateString) return '--';
  try {
    const mondayDate = startOfWeek(parseISO(dateString), { weekStartsOn: 1 });
    return `Week of ${format(mondayDate, 'dd/MM/yyyy')}`;
  } catch {
    return '--';
  }
};

// Appointment-specific formatting functions
export const formatAppointmentDateTime = (
  startTime: Appointment['startTime'] | null | undefined,
) => {
  if (!startTime) return '--';
  try {
    const date = parseISO(startTime);
    return format(date, 'dd/MM/yy h:mmaa');
  } catch {
    return '--';
  }
};

export const formatAppointmentClinician = (clinician: Appointment['clinician']) => {
  return clinician?.displayName || '--';
};

export const formatAppointmentFacility = (locationGroup: Appointment['locationGroup']) => {
  return locationGroup?.facility?.name || '--';
};

export const formatAppointmentArea = (
  location: Location | null | undefined,
  locationGroup: Appointment['locationGroup'],
) => {
  return locationGroup?.name || '--';
};

export const formatAppointmentType = (appointmentType: Appointment['appointmentType']) => {
  return appointmentType?.name || '--';
};
