import { VaccineStatus } from './patient';
import { differenceInDays, parseISO } from 'date-fns';
import { toNumber } from 'lodash';
import { IAdministeredVaccine, IPatient, IScheduledVaccine } from '~/types';

type Threshold<T> = { threshold: T; status: VaccineStatus };
type ParsedThresholds = Threshold<number>[];
type UnparsedThresholds = Threshold<number | '-Infinity'>[];

interface VaccineData {
  patientAdministeredVaccines: IAdministeredVaccine[];
  scheduledVaccine: IScheduledVaccine;
  patient: IPatient;
}

export type VaccineStatusMessage = {
  status: VaccineStatus;
  warningMessage?: string;
};

export const parseThresholdsSetting = (thresholds: UnparsedThresholds): ParsedThresholds =>
  thresholds
    ?.map(({ threshold, status }) => ({
      threshold: toNumber(threshold), // _.toNumber is used specifically to parse '-Infinity' and 'Infinity'
      status,
    }))
    .sort((a, b) => b.threshold - a.threshold);

const getStatus = (daysUntilDue: number, thresholds: ParsedThresholds) => {
  const status = thresholds.find(({ threshold }) => daysUntilDue > threshold)?.status;
  return status || VaccineStatus.UNKNOWN;
};

const getWarningMessage = (
  { scheduledVaccine }: VaccineData,
  daysUntilDue: number,
  status: VaccineStatus,
  lastDose: IAdministeredVaccine,
) => {
  const { weeksFromLastVaccinationDue } = scheduledVaccine;
  if (weeksFromLastVaccinationDue && !lastDose) {
    return 'This patient has not received the previous dose of this vaccine';
  }
  const weeksUntilDueAbs = Math.round(Math.abs(daysUntilDue / 7));
  if (status === VaccineStatus.MISSED) {
    return `Patient has missed this vaccine by ${weeksUntilDueAbs} weeks, please refer to the catchup schedule.`;
  }
  if ([VaccineStatus.SCHEDULED, VaccineStatus.UPCOMING].includes(status)) {
    return `This patient is not due to receive this vaccine for ${weeksUntilDueAbs} weeks.`;
  }
};

const getDaysUntilDue = (
  { scheduledVaccine, patient }: VaccineData,
  lastDose: IAdministeredVaccine,
) => {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue } = scheduledVaccine;
  const { dateOfBirth } = patient;
  const hasWeeksFromBirthDue = Number.isInteger(weeksFromBirthDue);
  const weeksFromDue = hasWeeksFromBirthDue ? weeksFromBirthDue : weeksFromLastVaccinationDue;
  const baselineDate = hasWeeksFromBirthDue ? dateOfBirth : lastDose?.date;
  return weeksFromDue * 7 - differenceInDays(new Date(), parseISO(baselineDate));
};

export const getLastDose = ({ scheduledVaccine, patientAdministeredVaccines }: VaccineData) => {
  const { vaccine, index, weeksFromLastVaccinationDue } = scheduledVaccine;
  if (!Number.isInteger(weeksFromLastVaccinationDue)) return null;
  return patientAdministeredVaccines?.find(administeredVaccine => {
    const scheduledVaccine = administeredVaccine.scheduledVaccine as IScheduledVaccine;
    return scheduledVaccine.index === index - 1 && scheduledVaccine.vaccine.id === vaccine.id;
  });
};

export const getVaccineStatus = (
  data: VaccineData,
  thresholds: ParsedThresholds,
): VaccineStatusMessage => {
  const lastDose = getLastDose(data);
  const daysUntilDue = getDaysUntilDue(data, lastDose);
  const status = getStatus(daysUntilDue, thresholds);
  const warningMessage = getWarningMessage(data, daysUntilDue, status, lastDose);
  return {
    status,
    warningMessage,
  };
};
