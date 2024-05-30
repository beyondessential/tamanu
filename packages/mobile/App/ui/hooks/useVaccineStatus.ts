import { SETTING_KEYS } from '~/constants';
import { useSettings } from '../contexts/SettingsContext';
import { VaccineStatus } from '../helpers/patient';
import { differenceInWeeks, parseISO } from 'date-fns';

type UpcomingVaccinationThresholds = { threshold: number; status: VaccineStatus }[];

export const diffWeeksDue = (date: string, weeksFromDue: number): number =>
  weeksFromDue - differenceInWeeks(new Date(), parseISO(date));

const getStatus = (weeksUntilDue: number, thresholds: UpcomingVaccinationThresholds) => {
  if (weeksUntilDue === null || !thresholds) {
    return VaccineStatus.UNKNOWN;
  }
  const status = thresholds.find(({ threshold }) => weeksUntilDue > threshold)?.status;

  return status || VaccineStatus.UNKNOWN;
};

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
    const lastDose = patientAdministeredVaccines?.find(
      ({ scheduledVaccine }: any) =>
        scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
    );
    return diffWeeksDue(lastDose?.date, weeksFromLastVaccinationDue);
  }
};

export const useVaccineStatus = (data: any = {}) => {
  const { getSetting } = useSettings();
  const thresholds = getSetting<any[]>(SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS);
  const parsedThresholds = thresholds.sort(
    (a, b) => b.threshold - a.threshold,
  ) as UpcomingVaccinationThresholds;

  const weeksUntilDue = getWeeksUntilDue(data);
  console.log(
    data.scheduledVaccine.label,
    getStatus(weeksUntilDue, parsedThresholds),
    weeksUntilDue,
  );
  return getStatus(weeksUntilDue, parsedThresholds);
};
