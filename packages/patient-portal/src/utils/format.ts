import { startOfWeek, parseISO } from 'date-fns';
import type {
  OngoingPrescription,
  AdministeredVaccine,
} from '@tamanu/shared/schemas/patientPortal';

const locale = globalThis.navigator?.language ?? 'default';

const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'short' });

type GetTranslation = (
  stringId: string,
  fallback: string,
  options?: { replacements?: Record<string, string> },
) => string;

// Medication-specific formatting functions
export const formatDose = (
  doseAmount: OngoingPrescription['doseAmount'],
  units: OngoingPrescription['dosingUnit'],
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

// Vaccination-specific formatting functions
export const formatVaccineGivenBy = (
  vaccine: AdministeredVaccine,
  getTranslation: GetTranslation,
) => {
  if (vaccine.status === 'NOT_GIVEN') {
    return getTranslation('vaccine.property.status.notGiven', 'Not given');
  }
  if (vaccine.givenElsewhere) {
    return getTranslation('vaccine.property.status.givenElsewhere', 'Given elsewhere');
  }
  return vaccine.givenBy || vaccine.recorder?.displayName || '--';
};

export const formatVaccineFacilityOrCountry = (vaccine: AdministeredVaccine) => {
  if (vaccine.givenElsewhere) {
    return vaccine.givenBy || '--';
  }
  return vaccine.location?.name || '--';
};

export const formatWeekOf = (
  dateString: string | null | undefined,
  getTranslation: GetTranslation,
) => {
  if (!dateString) return '--';
  try {
    const mondayDate = startOfWeek(parseISO(dateString), { weekStartsOn: 1 });
    return getTranslation('patientPortal.vaccinations.weekOf', 'Week of :date', {
      replacements: { date: dateFormatter.format(mondayDate) },
    });
  } catch {
    return '--';
  }
};
