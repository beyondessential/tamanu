import { differenceInWeeks } from 'date-fns';

export enum VaccineStatus {
  UNKNOWN,
  MISSED,
  NO_DUE_DATE,
  DUE,
  NOT_DUE,
  UPCOMING,
  OVERDUE,
}

export enum ScheduledVaccineStatus {
  GIVEN = 'GIVEN',
  NOT_GIVEN = 'NOT_GIVEN',
  SCHEDULED = 'SCHEDULED',
}

export function getWeeksFromBirth(dateOfBirth: string): number {
  return differenceInWeeks(new Date(), new Date(dateOfBirth));
}

export function getScheduledVaccineStatus(weeksUntilDue): VaccineStatus {
  if (weeksUntilDue === null) {
    return VaccineStatus.NO_DUE_DATE;
  }
  if (weeksUntilDue < -4) {
    return VaccineStatus.MISSED;
  }
  if (weeksUntilDue < 0) {
    return VaccineStatus.OVERDUE;
  }
  if (weeksUntilDue <= 2) {
    return VaccineStatus.DUE;
  }
  if (weeksUntilDue > 4) {
    return VaccineStatus.NOT_DUE;
  }
  if (weeksUntilDue > 2) {
    return VaccineStatus.UPCOMING;
  }

  return VaccineStatus.UNKNOWN;
}
