import { SEX_LABELS } from '@tamanu/constants';
import { formatShort } from '@tamanu/utils/dateTime';
import { format, startOfWeek, parseISO } from 'date-fns';

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '--/--/----';
  try {
    return formatShort(dateString) || '--/--/----';
  } catch {
    return '--/--/----';
  }
};

export const formatSex = (sex: string | undefined) => {
  if (!sex) return '--';
  return SEX_LABELS[sex as keyof typeof SEX_LABELS] || sex;
};

export const formatDisplayId = (displayId: string | undefined) => {
  return displayId || '--';
};

export const formatName = (name: string | null | undefined) => {
  return name || '--';
};

export const formatVillage = (village: { name?: string } | null | undefined) => {
  return village?.name || '--';
};

// Medication-specific formatting functions
export const formatDose = (doseAmount: number | null | undefined, units: string | undefined) => {
  if (doseAmount === null || doseAmount === undefined || !units) return '--';
  return `${doseAmount} ${units}`;
};

export const formatFrequency = (frequency: string | undefined) => {
  if (!frequency) return '--';
  // This will be enhanced once we integrate with the translation system
  // For now, return the frequency as-is with basic formatting
  return frequency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatRoute = (route: string | undefined) => {
  if (!route) return '--';
  // Basic route formatting - capitalize first letter
  return route.charAt(0).toUpperCase() + route.slice(1);
};

export const formatPrescriber = (prescriber?: { displayName?: string | null } | null) => {
  return prescriber?.displayName || '--';
};

// Vaccination-specific formatting functions
export const formatVaccineGivenBy = (vaccine: {
  status: string;
  givenElsewhere?: boolean | null;
  givenBy?: string | null;
  recorder?: { displayName?: string | null } | null;
}) => {
  if (vaccine.status === 'NOT_GIVEN') {
    return 'Not given';
  }
  if (vaccine.givenElsewhere) {
    return 'Given elsewhere';
  }
  return vaccine.givenBy || vaccine.recorder?.displayName || '--';
};

export const formatVaccineFacilityOrCountry = (vaccine: {
  givenElsewhere?: boolean | null;
  givenBy?: string | null;
  location?: { name?: string } | null;
}) => {
  if (vaccine.givenElsewhere) {
    return vaccine.givenBy || '--';
  }
  return vaccine.location?.name || '--';
};

export const formatVaccineStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    UPCOMING: 'Upcoming',
    DUE: 'Due',
    OVERDUE: 'Overdue',
    MISSED: 'Missed',
    GIVEN: 'Given',
    NOT_GIVEN: 'Not Given',
  };
  return statusMap[status] || status;
};

export const getVaccineStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'UPCOMING':
      return 'info';
    case 'DUE':
      return 'success';
    case 'OVERDUE':
      return 'warning';
    case 'MISSED':
      return 'error';
    default:
      return 'default';
  }
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
export const formatAppointmentDateTime = (startTime: string | null | undefined) => {
  if (!startTime) return '--';
  try {
    const date = parseISO(startTime);
    return format(date, 'dd/MM/yy h:mmaa');
  } catch {
    return '--';
  }
};

export const formatAppointmentClinician = (
  clinician: { displayName?: string | null } | null | undefined,
) => {
  return clinician?.displayName || '--';
};

export const formatAppointmentFacility = (
  location:
    | {
        name?: string;
        locationGroup?: { name?: string; facility?: { name?: string } | null } | null;
      }
    | null
    | undefined,
  locationGroup: { name?: string; facility?: { name?: string } | null } | null | undefined,
) => {
  // Priority: location.locationGroup.facility.name > locationGroup.facility.name > location.name > locationGroup.name
  const facilityName = location?.locationGroup?.facility?.name || locationGroup?.facility?.name;
  if (facilityName) return facilityName;

  return location?.name || locationGroup?.name || '--';
};

export const formatAppointmentArea = (
  location: { name?: string; locationGroup?: { name?: string } | null } | null | undefined,
  locationGroup: { name?: string } | null | undefined,
) => {
  return location?.locationGroup?.name || locationGroup?.name || '--';
};

export const formatAppointmentType = (appointmentType: { name?: string } | null | undefined) => {
  return appointmentType?.name || '--';
};
