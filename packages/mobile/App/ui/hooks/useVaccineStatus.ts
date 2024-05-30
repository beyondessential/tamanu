import { SETTING_KEYS } from '~/constants';
import { useSettings } from '../contexts/SettingsContext';
import { VaccineStatus } from '../helpers/patient';
import { differenceInWeeks, parseISO } from 'date-fns';

type UpcomingVaccinationThresholds = { threshold: number; status: VaccineStatus }[];

const getStatus = (weeksUntilDue: number, thresholds: UpcomingVaccinationThresholds) => {
  if (weeksUntilDue === null) {
    return { status: VaccineStatus.UNKNOWN };
  }
  for (const { threshold, status } of thresholds) {
    if (weeksUntilDue <= threshold) {
      return { status };
    }
  }
  return { status: VaccineStatus.UNKNOWN };
};

export function diffWeeksDue(date: string, weeksFromDue: number): number {
  return weeksFromDue - differenceInWeeks(new Date(), parseISO(date));
}

const getWeeksUntilDue = ({
  scheduledVaccine,
  patient,
  patientAdministeredVaccines = [],
}: any = {}) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue, vaccine, index } = scheduledVaccine;
  const { dateOfBirth } = patient;
  if (weeksFromBirthDue) {
    return diffWeeksDue(dateOfBirth, weeksFromBirthDue);
  }
  if (weeksFromLastVaccinationDue) {
    const lastDose = patientAdministeredVaccines.find(
      ({ scheduledVaccine }: any) =>
        scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
    );
    return diffWeeksDue(lastDose?.date, weeksFromLastVaccinationDue);
  }
};

export const useVaccineStatus = (data: any = {}) => {
  const { getSetting } = useSettings();
  const thresholds = getSetting<UpcomingVaccinationThresholds>(
    SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS,
  );
  return getStatus(getWeeksUntilDue(data), thresholds);
};
