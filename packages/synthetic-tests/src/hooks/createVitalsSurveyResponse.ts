import {
  NON_ANSWERABLE_DATA_ELEMENT_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  VITALS_DATA_ELEMENT_IDS,
} from '@tamanu/constants';

import { generateEncounterPayload } from './createEncounter';
import { nowIso9075 } from './dateUtils';

type VitalsSurveyComponent = {
  dataElement?: {
    id: string;
    type: string;
    code?: string;
  };
};

type VitalsSurveyResponse = {
  id: string;
  components: VitalsSurveyComponent[];
};


async function openEncounterForVitals(
  context: any,
): Promise<{ encounterId: string; patientId: string; api: any }> {
  const { api, facilityId } = context.vars;
  await generateEncounterPayload(context);
  const encounter = await api.post('encounter', {
    facilityId,
    ...context.vars.encounterPayload,
  });
  return { encounterId: encounter.id, patientId: encounter.patientId, api };
}

const SKIP_ANSWER_TYPES = new Set<string>([
  ...NON_ANSWERABLE_DATA_ELEMENT_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES.CALCULATED,
  PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
  PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
  PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
  PROGRAM_DATA_ELEMENT_TYPES.USER_DATA,
  PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK,
  PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER,
  PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE,
  PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE,
]);

const DATE_LIKE_TYPES = [
  PROGRAM_DATA_ELEMENT_TYPES.DATE,
  PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME,
  PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE,
];

const DEFAULT_NUMBERS: Record<string, number> = {
  [VITALS_DATA_ELEMENT_IDS.temperature]: 36.8,
  [VITALS_DATA_ELEMENT_IDS.weight]: 72,
  [VITALS_DATA_ELEMENT_IDS.height]: 175,
  [VITALS_DATA_ELEMENT_IDS.sbp]: 118,
  [VITALS_DATA_ELEMENT_IDS.dbp]: 76,
  [VITALS_DATA_ELEMENT_IDS.heartRate]: 72,
  [VITALS_DATA_ELEMENT_IDS.respiratoryRate]: 14,
  [VITALS_DATA_ELEMENT_IDS.spo2]: 98,
};

/**
 * Build answer map from live vitals survey components (numbers + date-like fields only).
 * Skips select/radio/binary/etc. so seeded surveys stay valid without option maps.
 */
function buildVitalsAnswersFromComponents(
  components: VitalsSurveyComponent[],
  submissionDate: string,
): Record<string, string | number> {
  const answers: Record<string, string | number> = {};

  for (const comp of components) {
    const de = comp.dataElement;
    if (!de?.id || !de.type) {
      continue;
    }
    if (SKIP_ANSWER_TYPES.has(de.type)) {
      continue;
    }

    if ((DATE_LIKE_TYPES as readonly string[]).includes(de.type)) {
      answers[de.id] = submissionDate;
      continue;
    }
    if (de.id === VITALS_DATA_ELEMENT_IDS.dateRecorded) {
      answers[de.id] = submissionDate;
      continue;
    }

    if (de.type === PROGRAM_DATA_ELEMENT_TYPES.NUMBER) {
      answers[de.id] = DEFAULT_NUMBERS[de.id] ?? 1;
    }
  }

  return answers;
}

/**
 * Creates an open encounter, loads the facility vitals survey, and builds a POST /api/surveyResponse body.
 * Also sets `vitalsEncounterId` for follow-up requests (e.g. GET encounter vitals).
 */
export async function generateVitalsSurveyResponsePayload(context: any, _events: any): Promise<void> {
  const { encounterId, patientId, api } = await openEncounterForVitals(context);

  const survey = (await api.get('survey/vitals')) as VitalsSurveyResponse;
  if (!survey?.id || !survey.components?.length) {
    throw new Error(
      'No vitals survey or components — seed a survey with surveyType vitals or skip vitals scenarios',
    );
  }

  const submissionDate = nowIso9075();
  const answers = buildVitalsAnswersFromComponents(survey.components, submissionDate);
  if (Object.keys(answers).length === 0) {
    throw new Error(
      'Vitals survey has no answerable number/date components in this environment; check survey config',
    );
  }

  const { facilityId } = context.vars;
  context.vars.vitalsEncounterId = encounterId;
  context.vars.vitalsSurveyResponsePayload = {
    surveyId: survey.id,
    encounterId,
    patientId,
    facilityId,
    startTime: submissionDate,
    endTime: submissionDate,
    answers,
  };
}
