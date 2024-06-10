import { VaccineStatus } from './patient';
import { differenceInDays, parseISO } from 'date-fns';

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

const getStatus = (daysUntilDue: number, thresholds: ParsedThresholds) => {
  const status = thresholds?.find(({ threshold }) => daysUntilDue > threshold)?.status;
  return status || VaccineStatus.UNKNOWN;
};

const getWarningMessage = (
  { scheduledVaccine }: any,
  daysUntilDue: number,
  status: VaccineStatus,
  lastDose: any,
) => {
  const { weeksFromLastVaccinationDue } = scheduledVaccine;
  if (weeksFromLastVaccinationDue && !lastDose) {
    return 'This patient has not received previous dose of this vaccine';
  }
  const weeksUntilDueAbs = Math.abs(daysUntilDue / 7);
  if (status === VaccineStatus.MISSED) {
    return `Patient has missed this vaccine by ${weeksUntilDueAbs} weeks, please refer to the catchup schedule.`;
  }
  if ([VaccineStatus.SCHEDULED, VaccineStatus.UPCOMING].includes(status)) {
    return `This patient is not due to receive this vaccine for ${weeksUntilDueAbs} weeks.`;
  }
};

const getDaysUntilDue = ({ scheduledVaccine, patient }: any = {}, lastDose: any) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue } = scheduledVaccine;
  const { dateOfBirth } = patient;
  // TODO Should return early if both defined or none defined
  const weeksFromDue = weeksFromBirthDue || weeksFromLastVaccinationDue;
  const date = weeksFromBirthDue ? dateOfBirth : lastDose?.date;
  return weeksFromDue * 7 - differenceInDays(new Date(), parseISO(date));
};

export const getLastDose = (scheduledVaccine, patientAdministeredVaccines) => {
  const { vaccine, index, weeksFromLastVaccinationDue } = scheduledVaccine;
  if (!weeksFromLastVaccinationDue) return null;
  return patientAdministeredVaccines?.find(
    ({ scheduledVaccine }: any) =>
      scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id,
  );
};

export const getVaccineStatus = (data: any = {}, thresholds): VaccineStatusMessage => {
  const { scheduledVaccine, patientAdministeredVaccines } = data;
  const lastDose = getLastDose(scheduledVaccine, patientAdministeredVaccines);
  const daysUntilDue = getDaysUntilDue(data, lastDose);
  const status = getStatus(daysUntilDue, thresholds);
  const warningMessage = getWarningMessage(data, daysUntilDue, status, lastDose);
  return {
    status,
    warningMessage,
  };
};
