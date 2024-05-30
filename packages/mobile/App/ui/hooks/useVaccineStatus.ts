import { SETTING_KEYS } from '~/constants';
import { useSettings } from '../contexts/SettingsContext';
import { VaccineStatus } from '../helpers/patient';
import { differenceInDays, parseISO } from 'date-fns';
import { IScheduledVaccine } from '~/types';

type Thresholds<T> = { threshold: T; status: VaccineStatus }[];
type ParsedThresholds = Thresholds<number>;
type UnparsedThresholds = Thresholds<number | '-Infinity'>;

const parseThresholdsSetting = (thresholds: UnparsedThresholds): ParsedThresholds =>
  thresholds
    ?.map(({ threshold, status }: any) => ({
      threshold: threshold === '-Infinity' ? -Infinity : threshold,
      status,
    }))
    .sort((a, b) => b.threshold - a.threshold);

const getStatus = (weeksUntilDue: number, thresholds: ParsedThresholds) => {
  const status = thresholds.find(({ threshold }) => weeksUntilDue > threshold)?.status;
  return status || VaccineStatus.UNKNOWN;
};

const getWarningMessage = (
  { weeksFromBirthDue, weeksFromLastVaccinationDue }: IScheduledVaccine,
  status: VaccineStatus,
) => {
  // TODO
  return null;
};

const getWeeksUntilDue = ({
  scheduledVaccine,
  patient,
  patientAdministeredVaccines = [],
}: any = {}) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue, vaccine, index } = scheduledVaccine;
  const { dateOfBirth } = patient;
  // Should return early if both defined or none defined
  const weeksFromDue = weeksFromBirthDue || weeksFromLastVaccinationDue;
  const lastDose =
    weeksFromLastVaccinationDue &&
    patientAdministeredVaccines?.find(
      ({ scheduledVaccine }: any) =>
        scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
    );
  const date = weeksFromBirthDue ? dateOfBirth : lastDose?.date;
  return weeksFromDue * 7 - differenceInDays(new Date(), parseISO(date));
};

export const useVaccineStatus = (data: any = {}) => {
  const { getSetting } = useSettings();
  const thresholds = parseThresholdsSetting(
    getSetting<UnparsedThresholds>(SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS),
  );
  const weeksUntilDue = getWeeksUntilDue(data);
  const status = getStatus(weeksUntilDue, thresholds);
  const warningMessage = getWarningMessage(data, status);
  return {
    status,
    warningMessage,
  };
};
