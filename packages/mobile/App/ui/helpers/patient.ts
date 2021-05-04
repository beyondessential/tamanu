import { differenceInWeeks } from 'date-fns';
import { StringifyOptions } from 'querystring';

export enum VaccineStatus {
  UNKNOWN = 'UNKNOWN',
  GIVEN = 'GIVEN',
  NOT_GIVEN = 'NOT_GIVEN',
  SCHEDULED = 'SCHEDULED',
  MISSED = 'MISSED',
  DUE = 'DUE',
  UPCOMING = 'UPCOMING',
  OVERDUE = 'OVERDUE',
}

export function getWeeksFromBirth(dateOfBirth: string): number {
  return differenceInWeeks(new Date(), new Date(dateOfBirth));
}

export function getVaccineStatus(weeksUntilDue): VaccineStatus {
  if (weeksUntilDue === null) {
    return VaccineStatus.UNKNOWN;
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
    return VaccineStatus.SCHEDULED;
  }
  if (weeksUntilDue > 2) {
    return VaccineStatus.UPCOMING;
  }

  return VaccineStatus.UNKNOWN;
}

const generators = {
  A: (): string => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  0: (): string => Math.floor(Math.random() * 10).toFixed(0),
};

function createIdGenerator(format): () => {} {
  const generatorPattern = Array.from(format).map((char: string) => generators[char] || ((): string => ''));

  return (): string => generatorPattern.map(generator => generator()).join('');
}

export const generateId = createIdGenerator('AAAA000000');
