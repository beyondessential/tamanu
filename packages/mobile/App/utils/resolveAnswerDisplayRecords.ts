import { In } from 'typeorm';
import { chunk } from 'es-toolkit';
import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';

import { FieldTypes } from '~/ui/helpers/fields';
import type { ISurveyScreenComponent } from '~/types';
import type { SurveyResponse } from '~/models/SurveyResponse';

/**
 * SQLite caps the number of bound parameters per statement (999 on older builds), and the
 * referral history screen accumulates ids across every referral a patient has.
 */
const MAXIMUM_IDS_PER_QUERY = 500;

/** A question paired with the answer body recorded against it. */
export type AnswerToDisplay = {
  type: string;
  /** Raw JSON string as stored on SurveyScreenComponent, so it may be null or malformed. */
  config: string | null;
  answer: string;
};

export type AnswerDisplayRecords = {
  /** Autocomplete and PatientData answers: the referenced record, by model name then id. */
  recordsByModelNameAndId: Record<string, Record<string, any>>;
  /** SurveyAnswer answers: the screen component owning the referenced data element code. */
  sourceQuestionsByDataElementCode: Record<string, ISurveyScreenComponent>;
  /** SurveyLink answers: the linked response and its survey, by response id. */
  linkedSurveyResponsesById: Record<string, SurveyResponse>;
};

/**
 * Survey config is authored outside the app, so it may be absent or malformed. Matches the
 * tolerance of SurveyScreenComponent.getConfigObject.
 */
const parseConfig = (config: string | null): Record<string, any> => {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`Invalid survey screen component config: ${config}`);
    return {};
  }
};

const getSourceDataElementCode = (config: string | null): string | undefined => {
  const { source, Source } = parseConfig(config);
  return source ?? Source;
};

/**
 * Resolves the model a PatientData answer points at, or null when the column holds a plain
 * value rather than a reference. Mirrors the relation walk the form-path
 * PatientDataDisplayField performs per field.
 */
export const getPatientDataTargetModelName = (
  models: any,
  column: string | undefined,
): string | null => {
  const [modelName, fieldName, options] = (column && PATIENT_DATA_FIELD_LOCATIONS[column]) ?? [];
  // Fields with options are translated enums, and custom fields have no configured location.
  if (!modelName || options) return null;

  const model = models[modelName];
  if (!model) return null;

  // Relations are declared as either 'village' or 'villageId' depending on the model.
  const fieldNameWithoutIdSuffix = fieldName.replace(/Id$/, '');
  const relation = model
    .getRepository()
    .metadata.relations.find(
      ({ propertyName }) => propertyName === fieldName || propertyName === fieldNameWithoutIdSuffix,
    );
  return relation?.inverseEntityMetadata.target.name ?? null;
};

const findSourceQuestionsByDataElementCode = async (
  models: any,
  dataElementCodes: string[],
): Promise<Record<string, ISurveyScreenComponent>> => {
  if (!dataElementCodes.length) return {};

  const sourceDataElements = await models.ProgramDataElement.getRepository().find({
    where: { code: In(dataElementCodes) },
    relations: ['surveyScreenComponent', 'surveyScreenComponent.dataElement'],
  });

  return Object.fromEntries(
    sourceDataElements
      .filter(({ surveyScreenComponent }) => surveyScreenComponent)
      .map(({ code, surveyScreenComponent }) => [code, surveyScreenComponent]),
  );
};

/**
 * A SurveyAnswer question renders as the question it points at, so the source question's own
 * type and config may themselves need a record. Only one level is resolved: a SurveyAnswer
 * sourcing another SurveyAnswer is not a supported configuration.
 */
const getSubstitutedAnswers = (
  answersToDisplay: AnswerToDisplay[],
  sourceQuestionsByDataElementCode: Record<string, ISurveyScreenComponent>,
): AnswerToDisplay[] =>
  answersToDisplay
    .filter(({ type }) => type === FieldTypes.SURVEY_ANSWER)
    .map(({ config, answer }) => ({
      sourceQuestion: sourceQuestionsByDataElementCode[getSourceDataElementCode(config)],
      answer,
    }))
    .filter(({ sourceQuestion }) => sourceQuestion)
    .map(({ sourceQuestion, answer }) => ({
      type: sourceQuestion.dataElement.type,
      config: sourceQuestion.config ?? null,
      answer,
    }));

const collectLookups = (models: any, answersToDisplay: AnswerToDisplay[]) => {
  const recordIdsByModelName: Record<string, string[]> = {};
  const linkedSurveyResponseIds: string[] = [];

  const addRecordId = (modelName: string | null, recordId: string): void => {
    // An unknown source is a configuration typo; skip it rather than failing every answer.
    if (!modelName || !models[modelName]) return;
    recordIdsByModelName[modelName] ??= [];
    recordIdsByModelName[modelName].push(recordId);
  };

  for (const { type, config, answer } of answersToDisplay) {
    switch (type) {
      case FieldTypes.AUTOCOMPLETE:
        addRecordId(parseConfig(config).source ?? null, answer);
        break;
      case FieldTypes.PATIENT_DATA:
        addRecordId(getPatientDataTargetModelName(models, parseConfig(config).column), answer);
        break;
      case FieldTypes.SURVEY_LINK:
        linkedSurveyResponseIds.push(answer);
        break;
      default:
        break;
    }
  }

  return { recordIdsByModelName, linkedSurveyResponseIds };
};

/**
 * Deliberately uses find rather than findVisible: an answer recorded against a record that has
 * since become historical must still display its name.
 */
const findRecordsByIds = async (models: any, modelName: string, recordIds: string[]) => {
  const repository = models[modelName].getRepository();
  const recordsById: Record<string, any> = {};

  // Sequential rather than parallel: the app shares one SQLite connection.
  for (const idChunk of chunk([...new Set(recordIds)], MAXIMUM_IDS_PER_QUERY)) {
    const records = await repository.find({ where: { id: In(idChunk) } });
    for (const record of records) {
      recordsById[record.id] = record;
    }
  }

  return recordsById;
};

const findLinkedSurveyResponsesById = async (
  models: any,
  surveyResponseIds: string[],
): Promise<Record<string, SurveyResponse>> => {
  const responsesById: Record<string, SurveyResponse> = {};

  for (const idChunk of chunk([...new Set(surveyResponseIds)], MAXIMUM_IDS_PER_QUERY)) {
    const responses = await models.SurveyResponse.getRepository().find({
      where: { id: In(idChunk) },
      relations: ['survey'],
    });
    for (const response of responses) {
      responsesById[response.id] = response;
    }
  }

  return responsesById;
};

/**
 * Resolves every record a set of survey answers needs to render, batched to one query per
 * distinct source model rather than one query per answer.
 *
 * A lookup that finds nothing is left out of the returned maps. That is ordinary domain
 * behaviour for a deleted or not-yet-synced record, and renderers fall back to the raw answer.
 */
export const resolveAnswerDisplayRecords = async (
  models: any,
  answersToDisplay: AnswerToDisplay[],
): Promise<AnswerDisplayRecords> => {
  const sourceDataElementCodes = [
    ...new Set(
      answersToDisplay
        .filter(({ type }) => type === FieldTypes.SURVEY_ANSWER)
        .map(({ config }) => getSourceDataElementCode(config))
        .filter(Boolean),
    ),
  ];
  const sourceQuestionsByDataElementCode = await findSourceQuestionsByDataElementCode(
    models,
    sourceDataElementCodes,
  );

  const substitutedAnswers = getSubstitutedAnswers(
    answersToDisplay,
    sourceQuestionsByDataElementCode,
  );
  const { recordIdsByModelName, linkedSurveyResponseIds } = collectLookups(models, [
    ...answersToDisplay,
    ...substitutedAnswers,
  ]);

  const recordsByModelNameAndId: Record<string, Record<string, any>> = {};
  for (const [modelName, recordIds] of Object.entries(recordIdsByModelName)) {
    recordsByModelNameAndId[modelName] = await findRecordsByIds(models, modelName, recordIds);
  }

  const linkedSurveyResponsesById = linkedSurveyResponseIds.length
    ? await findLinkedSurveyResponsesById(models, linkedSurveyResponseIds)
    : {};

  return {
    recordsByModelNameAndId,
    sourceQuestionsByDataElementCode,
    linkedSurveyResponsesById,
  };
};
