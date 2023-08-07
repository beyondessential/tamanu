import { formatISO9075, subSeconds, differenceInYears, differenceInMonths } from 'date-fns';
import { Activity, CallArgs, Role, chance, getSurvey } from './prelude.js';
import {
  SurveyComponent,
  SurveyComponentCriteriaAgeRange,
  SurveyComponentCriteriaRange,
} from '../surveys.js';

export class FillSurvey extends Activity {
  #surveyId?: string;
  #patientId?: string;
  #patientAgeYears?: number;
  #patientAgeMonths?: number;
  #encounterId?: string;

  async gather(role: Role, args: CallArgs): Promise<void> {
    this.#surveyId = args.surveyId as string;
    this.#patientId = args.patientId as string;
    this.#encounterId = args.encounterId as string;

    const api = await this.context.api.as(role);
    const patient = await api.get(`patient/${this.#patientId}`);
    const dob = new Date(patient.dateOfBirth);
    this.#patientAgeYears = differenceInYears(new Date(), dob);
    this.#patientAgeMonths = differenceInMonths(new Date(), dob);
  }

  async act(role: Role): Promise<void> {
    const api = await this.context.api.as(role);

    const surveyId = this.#surveyId;
    if (!surveyId) throw new Error('Survey ID not set');
    const survey = await getSurvey(api, surveyId);

    const duration = chance.natural({ min: 30, max: 300 });
    const endTime = new Date();
    await api.post('surveyResponse', {
      patientId: this.#patientId,
      encounterId: this.#encounterId,
      surveyId: survey.id,
      startTime: formatISO9075(subSeconds(endTime, duration)),
      endTime: formatISO9075(endTime),
      actions: {},
      answers: Object.fromEntries(
        survey.components
          .map((component) => {
            const answer = randomAnswer(component, {
              now: endTime,
              age: {
                years: this.#patientAgeYears ?? 0,
                months: this.#patientAgeMonths ?? 0,
              },
            });
            if (!answer) return null;

            return [component.dataElement.id, answer];
          })
          .filter((_) => _) as [string, number | string][],
      ),
    });
  }
}

function randomAnswer(
  component: SurveyComponent,
  opts: { now: Date; age: { years: number; months: number } },
): null | number | string {
  switch (component.dataElement.type) {
    case 'Number': {
      if (component.validationCriteria?.normalRange) {
        return randomBiasedAnswer(
          component.validationCriteria,
          component.validationCriteria?.normalRange,
          opts.age,
        );
      }

      return chance.natural({
        min: component.validationCriteria?.min ?? 0,
        max: component.validationCriteria?.max ?? 100,
      });
    }
    case 'Select': {
      return chance.pickone(Object.keys(component.dataElement.defaultOptions));
    }
    case 'DateTime': {
      return formatISO9075(opts.now);
    }
    case 'CalculatedQuestion': {
      return null;
    }
    default: {
      throw new Error(`Unsupported data element type: ${component.dataElement.type}`);
    }
  }
}

function randomBiasedAnswer(
  allowedRange: SurveyComponentCriteriaRange,
  surveyRange: SurveyComponentCriteriaRange | SurveyComponentCriteriaAgeRange[],
  age: { years: number; months: number },
): number {
  let normalRange: SurveyComponentCriteriaRange | undefined = undefined;
  if (Array.isArray(surveyRange)) {
    for (const { ageMin, ageMax, ageUnit } of surveyRange) {
      switch (ageUnit) {
        case 'years': {
          if (age.years >= ageMin && (!ageMax || age.years <= ageMax)) {
            normalRange = { min: ageMin, max: ageMax };
          }
          break;
        }
        case 'months': {
          if (age.months >= ageMin && (!ageMax || age.months <= ageMax)) {
            normalRange = { min: ageMin, max: ageMax };
          }
          break;
        }
        default: {
          throw new Error(`Unsupported age unit: "${ageUnit}"`);
        }
      }
    }
  } else {
    normalRange = surveyRange;
  }

  if (!normalRange) {
    throw new Error('No normal range found');
  }

  // Most of the time stay within the normal range
  if (chance.bool({ likelihood: 80 })) {
    return chance.integer({
      min: normalRange.min,
      max: normalRange.max,
    });
  }

  // Sometimes go outside the normal range but still within validation
  if (chance.bool()) {
    // below normal range
    return chance.integer({
      min: allowedRange.min,
      max: normalRange.min,
    });
  } else {
    // above normal range
    return chance.integer({
      min: normalRange.max,
      max: allowedRange.max,
    });
  }

  // TODO: decimals?
}
