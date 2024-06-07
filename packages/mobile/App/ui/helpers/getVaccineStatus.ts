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
  weeksUntilDue: number,
  status: VaccineStatus,
) => {
  if (status === VaccineStatus.MISSED) {
    return `Patient has missed this vaccine by ${Math.abs(
      Math.round(weeksUntilDue / 7),
    )} weeks, please refer to the catchup schedule.`;
  }

  if (status === VaccineStatus.SCHEDULED || status === VaccineStatus.UPCOMING) {
    return `This patient is not due to receive this vaccine for ${weeksUntilDue} weeks.`;
  }

   // TODO: not sure how to check this
  // if (weeksFromLastVaccinationDue) {
  //   return `This patient has not received the previous dose of this vaccine`;
  // }

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

export const getVaccineStatus = (data: any = {}, thresholds): VaccineStatusMessage => {
  const weeksUntilDue = getWeeksUntilDue(data);
  const status = getStatus(weeksUntilDue, thresholds);
  const warningMessage = getWarningMessage(data, weeksUntilDue, status);
  return {
    status,
    warningMessage,
  };
};
