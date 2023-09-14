import { differenceInWeeks, parseISO } from 'date-fns';

export enum VaccineStatus {
  UNKNOWN = 'UNKNOWN',
  GIVEN = 'GIVEN',
  NOT_GIVEN = 'NOT_GIVEN',
  SCHEDULED = 'SCHEDULED',
  MISSED = 'MISSED',
  DUE = 'DUE',
  UPCOMING = 'UPCOMING',
  OVERDUE = 'OVERDUE',
  RECORDED_IN_ERROR = 'RECORDED_IN_ERROR',
  HISTORICAL = 'HISTORICAL',
}

export enum VaccineCategory {
  CAMPAIGN = 'Campaign',
  CATCHUP = 'Catchup',
  ROUTINE = 'Routine',
  OTHER = 'Other',
}

export function getWeeksFromDate(date: string): number {
  return differenceInWeeks(new Date(), parseISO(date));
}

type VaccineStatusMessage = {
  status: VaccineStatus;
  warningMessage?: string;
};

function getVaccineStatusForWeeksFromBirthDue(weeksUntilDue): VaccineStatusMessage {
  if (weeksUntilDue === null) {
    return { status: VaccineStatus.UNKNOWN };
  }
  if (weeksUntilDue < -4) {
    return {
      status: VaccineStatus.MISSED,
      warningMessage: `Patient has missed this vaccine by ${Math.abs(
        weeksUntilDue,
      )} weeks, please refer to the catchup schedule.`,
    };
  }
  if (weeksUntilDue < 0) {
    return { status: VaccineStatus.OVERDUE };
  }
  if (weeksUntilDue <= 2) {
    return { status: VaccineStatus.DUE };
  }
  if (weeksUntilDue > 4) {
    return {
      status: VaccineStatus.SCHEDULED,
      warningMessage: `This patient is not due to receive this vaccine for ${weeksUntilDue} weeks.`,
    };
  }
  if (weeksUntilDue > 2) {
    return {
      status: VaccineStatus.UPCOMING,
    };
  }

  return { status: VaccineStatus.UNKNOWN };
}

function getVaccineStatusForWeeksFromLastVaccinationDue(
  weeksUntilGapPeriodPassed,
  previouslyAdministeredVaccine,
  index,
): VaccineStatusMessage {
  if (!previouslyAdministeredVaccine) {
    return {
      status: VaccineStatus.SCHEDULED,
      warningMessage: `This patient has not received dose ${index - 1} of this vaccine.`,
    };
  }
  if (weeksUntilGapPeriodPassed > 0) {
    return {
      status: VaccineStatus.SCHEDULED,
      warningMessage: `This patient is not due to receive this vaccine for ${weeksUntilGapPeriodPassed} weeks.`,
    };
  }

  return { status: VaccineStatus.UNKNOWN };
}

export function getVaccineStatus(
  scheduledVaccine,
  patient,
  administeredVaccines,
): VaccineStatusMessage {
  const { weeksFromBirthDue, weeksFromLastVaccinationDue, index, vaccine: drug } = scheduledVaccine;
  const previouslyAdministeredVaccine =
    administeredVaccines &&
    administeredVaccines.find(vaccine => {
      const previousVaccine = vaccine.scheduledVaccine.index === index - 1;
      const matchingDrug = vaccine.scheduledVaccine.vaccine.id === drug.id;

      return previousVaccine && matchingDrug && weeksFromLastVaccinationDue;
    });
  const weeksUntilDue = weeksFromBirthDue - getWeeksFromDate(patient.dateOfBirth);
  // returns NaN if previouslyAdministeredVaccine is null, 0 if weeksFromLastVaccinationDue is null,
  // or the amount of weeks until the amount of weeks required between vaccines has passed.
  const weeksUntilGapPeriodPassed =
    weeksFromLastVaccinationDue - getWeeksFromDate(previouslyAdministeredVaccine?.date);

  if (weeksFromBirthDue) return getVaccineStatusForWeeksFromBirthDue(weeksUntilDue);
  if (weeksFromLastVaccinationDue) {
    return getVaccineStatusForWeeksFromLastVaccinationDue(
      weeksUntilGapPeriodPassed,
      previouslyAdministeredVaccine,
      index,
    );
  }

  return { status: VaccineStatus.UNKNOWN };
}

const generators = {
  A: (): string => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  0: (): string => Math.floor(Math.random() * 10).toFixed(0),
};

function createIdGenerator(format): () => {} {
  const generatorPattern = Array.from(format).map(
    (char: string) => generators[char] || ((): string => ''),
  );

  return (): string => generatorPattern.map(generator => generator()).join('');
}

export const generateId = createIdGenerator('AAAA000000');
