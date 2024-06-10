import { VaccineStatus } from './patient';
import { differenceInDays, parseISO } from 'date-fns';
import { IScheduledVaccine } from '~/types';

type Thresholds<T> = { threshold: T; status: VaccineStatus }[];
type ParsedThresholds = Thresholds<number>;
type UnparsedThresholds = Thresholds<number | '-Infinity'>;

export type VaccineStatusMessage = {
  status: VaccineStatus;
  warningMessage?: string;
};

export const parseThresholdsSetting = (thresholds: UnparsedThresholds): ParsedThresholds =>
  thresholds
    ?.map(({ threshold, status }: any) => ({
      threshold: threshold === '-Infinity' ? -Infinity : threshold,
      status,
    }))
    .sort((a, b) => b.threshold - a.threshold);

const getStatus = (weeksUntilDue: number, thresholds: ParsedThresholds) => {
  const status = thresholds?.find(({ threshold }) => weeksUntilDue > threshold)?.status;
  return status || VaccineStatus.UNKNOWN;
};

const getWarningMessage = (
  { weeksFromBirthDue, weeksFromLastVaccinationDue }: IScheduledVaccine,
  daysUntilDue: number,
  status: VaccineStatus,
) => {
  const weeksUntilDueAbs = Math.abs(daysUntilDue / 7);
  if (weeksFromBirthDue) {
    if (status === VaccineStatus.MISSED) {
      return `Patient has missed this vaccine by ${weeksUntilDueAbs} weeks, please refer to the catchup schedule.`;
    }
    if ([VaccineStatus.SCHEDULED, VaccineStatus.UPCOMING].includes(status)) {
      return `This patient is not due to receive this vaccine for ${weeksUntilDueAbs} weeks.`;
    }
  } else if (weeksFromLastVaccinationDue) {
    return null; // todo
  }
};

const getDaysUntilDue = ({
  scheduledVaccine,
  patient,
  patientAdministeredVaccines = [],
}: any = {}) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue, vaccine, index } = scheduledVaccine;
  const { dateOfBirth } = patient;
  // TODO Should return early if both defined or none defined
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

export const getVaccineStatus = (data: any = {}, thresholds): VaccineStatusMessage => {
  const daysUntilDue = getDaysUntilDue(data);
  const status = getStatus(daysUntilDue, thresholds);
  const warningMessage = getWarningMessage(data, daysUntilDue, status);
  return {
    status,
    warningMessage,
  };
};
