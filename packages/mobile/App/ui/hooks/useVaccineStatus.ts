import { SETTING_KEYS } from '~/constants';
import { useSettings } from '../contexts/SettingsContext';
import { VaccineStatus } from '../helpers/patient';
import { differenceInDays, parseISO } from 'date-fns';

type UpcomingVaccinationThresholds = { threshold: number; status: VaccineStatus }[];

export const diffDaysDue = (date: string, weeksFromDue: number): number =>
  weeksFromDue * 7 - differenceInDays(new Date(), parseISO(date));

const getWeeksUntilDue = ({
  scheduledVaccine,
  patient,
  patientAdministeredVaccines = [],
}: any = {}) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue, vaccine, index } = scheduledVaccine;
  const { dateOfBirth } = patient;
  if (weeksFromBirthDue) {
    return diffDaysDue(dateOfBirth, weeksFromBirthDue);
  }
  if (weeksFromLastVaccinationDue) {
    const lastDose = patientAdministeredVaccines?.find(
      ({ scheduledVaccine }: any) =>
        scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
    );
    return diffDaysDue(lastDose?.date, weeksFromLastVaccinationDue);
  }
};

export const useVaccineStatus = (data: any = {}) => {
  const { getSetting } = useSettings();
  const thresholds = getSetting<any[]>(SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS);
  const parsedThresholds = thresholds
    .map(({ threshold, status }) => ({
      threshold: threshold === '-Infinity' ? -Infinity : threshold,
      status,
    }))
    .sort((a, b) => b.threshold - a.threshold) as UpcomingVaccinationThresholds;

  const weeksUntilDue = getWeeksUntilDue(data);
  const status = parsedThresholds.find(({ threshold }) => weeksUntilDue > threshold)?.status;
  return status || VaccineStatus.UNKNOWN;
};
