import { DataTypes, Op, Sequelize } from 'sequelize';
import {
  CHARTING_DATA_ELEMENT_IDS,
  CHARTING_SURVEY_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import {
  getActiveActionComponents,
  getResultValue,
  getStringValue,
} from '@tamanu/shared/utils/fields';
import { getPatientDataDbLocation } from '@tamanu/shared/utils/getPatientDataDbLocation';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

async function createPatientIssues(models: Models, questions: any[], patientId: string) {
  const issueQuestions = questions.filter(
    q => q.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
  );
  for (const question of issueQuestions) {
    const { config: configString } = question;
    const config = safeJsonParse(configString) ?? {};
    if (!config.issueNote || !config.issueType) {
      throw new InvalidOperationError(`Ill-configured PatientIssue with config: ${configString}`);
    }
    await models.PatientIssue.create({
      patientId,
      type: config.issueType,
      note: config.issueNote,
    });
  }
}

/** Returns in the format:
 * {
 *  Patient: { key1: 'value1' },
 *  PatientAdditionalData: { key1: 'value1' },
 * }
 */
const getFieldsToWrite = async (models: Models, questions: any[], answers: any[]) => {
  const recordValuesByModel: Record<string, Record<string, any>> = {};

  const patientDataQuestions = questions.filter(
    q => q.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
  );
  for (const question of patientDataQuestions) {
    const { dataElement, config: configString } = question;
    const config = JSON.parse(configString) || {};

    if (!config.writeToPatient) {
      // this is just a question that's reading patient data, not writing it
      continue;
    }

    const { fieldName: configFieldName } = config.writeToPatient || {};
    if (!configFieldName) {
      throw new Error('No fieldName defined for writeToPatient config');
    }
    const value = answers[dataElement.id];

    const { modelName, fieldName } = await getPatientDataDbLocation(configFieldName, models);

    if (!modelName) {
      throw new Error(`Unknown fieldName: ${configFieldName}`);
    }
    if (!recordValuesByModel[modelName]) recordValuesByModel[modelName] = {};
    recordValuesByModel[modelName][fieldName] = value;
  }
  return recordValuesByModel;
};

/**
 * DUPLICATED IN mobile/App/models/SurveyResponse.ts
 * Please keep in sync
 */
async function writeToPatientFields(
  models: Models,
  facilityId: string,
  questions: any[],
  answers: any[],
  patientId: string,
  surveyId: string,
  userId: string,
  submittedTime: string,
) {
  const valuesByModel = await getFieldsToWrite(models, questions, answers);

  if (valuesByModel.Patient) {
    const patient = await models.Patient.findByPk(patientId);
    await patient?.update(valuesByModel.Patient);
  }

  if (valuesByModel.PatientFieldValue) {
    const patient = await models.Patient.findByPk(patientId);
    await patient?.writeFieldValues(valuesByModel.PatientFieldValue);
  }

  if (valuesByModel.PatientAdditionalData) {
    const pad = await models.PatientAdditionalData.getOrCreateForPatient(patientId);
    await pad.update(valuesByModel.PatientAdditionalData);
  }

  if (valuesByModel.PatientProgramRegistration) {
    const survey = await models.Survey.findByPk(surveyId);
    const programRegistryDetail = await models.ProgramRegistry.findOne({
      where: { programId: survey?.programId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });
    if (!programRegistryDetail?.id) {
      throw new Error('No program registry configured for the current form');
    }

    // Check if a record already exists with the given patientId and programRegistryId
    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        patientId,
        programRegistryId: programRegistryDetail.id,
      },
    });

    const registrationData = {
      patientId,
      programRegistryId: programRegistryDetail.id,
      date: submittedTime,
      ...valuesByModel.PatientProgramRegistration,
      registeringFacilityId:
        valuesByModel.PatientProgramRegistration.registeringFacilityId || facilityId,
      clinicianId: valuesByModel.PatientProgramRegistration.clinicianId || userId,
    };

    if (existingRegistration) {
      // Update the existing record
      await existingRegistration.update(registrationData);
    } else {
      // Create a new record
      await models.PatientProgramRegistration.create(registrationData);
    }
  }
}

async function handleSurveyResponseActions(
  models: Models,
  facilityId: string,
  questions: any[],
  answers: any[],
  patientId: string,
  surveyId: string,
  userId: string,
  submittedTime: string,
) {
  const activeQuestions = getActiveActionComponents(questions, answers);
  await createPatientIssues(models, activeQuestions, patientId);
  await writeToPatientFields(
    models,
    facilityId,
    activeQuestions,
    answers,
    patientId,
    surveyId,
    userId,
    submittedTime,
  );
}

// Special case for answers that depend on creating a new record in the database
// and store the ID of the new record in the answer body. Currently only used for photos.
async function getBodyForAnswer(dataElementType: string, value: any, models: Models) {
  if (dataElementType === PROGRAM_DATA_ELEMENT_TYPES.PHOTO && !!value) {
    const { size, data } = value as unknown as { size: number; data: string };
    const { id: attachmentId } = await models.Attachment.create(
      models.Attachment.sanitizeForDatabase({
        type: 'image/jpeg',
        size,
        data,
      }),
    );
    // Store the attachment ID in the answer body
    return attachmentId;
  }

  return getStringValue(dataElementType, value);
}

export class SurveyResponse extends Model {
  declare id: string;
  declare startTime?: string;
  declare endTime?: string;
  declare result?: number;
  declare resultText?: string;
  declare notified?: boolean;
  declare metadata?: Record<string, any>;
  declare userId?: string;
  declare surveyId?: string;
  declare encounterId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        startTime: dateTimeType('startTime', { allowNull: true }),
        endTime: dateTimeType('endTime', { allowNull: true }),
        result: { type: DataTypes.FLOAT, allowNull: true },
        resultText: { type: DataTypes.TEXT, allowNull: true },
        notified: { type: DataTypes.BOOLEAN, allowNull: true }, // null is not notified, false is notified but not yet processed, true is processed
        metadata: { type: DataTypes.JSONB, allowNull: true },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      as: 'survey',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasMany(models.SurveyResponseAnswer, {
      foreignKey: 'responseId',
      as: 'answers',
    });

    this.hasOne(models.Referral, {
      foreignKey: 'surveyResponseId',
      as: 'referral',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }

  static async getSurveyEncounter({
    encounterId,
    patientId,
    forceNewEncounter,
    reasonForEncounter,
    answers,
    ...responseData
  }: {
    encounterId: string | null;
    patientId: string;
    forceNewEncounter: boolean;
    reasonForEncounter: string;
    answers?: Record<string, any>;
    [key: string]: any;
  }) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('SurveyResponse.getSurveyEncounter must always run inside a transaction!');
    }

    const { Encounter } = this.sequelize.models;

    if (encounterId) {
      return Encounter.findByPk(encounterId);
    }

    if (!patientId) {
      throw new InvalidOperationError(
        'A survey response must have an encounter or patient ID attached',
      );
    }

    // Extract date - chart entries have dateRecorded field, complex chart instances have complexChartDate
    const dateRecordedValue = answers?.[CHARTING_DATA_ELEMENT_IDS.dateRecorded]
      || answers?.[CHARTING_DATA_ELEMENT_IDS.complexChartDate];

    if (!forceNewEncounter) {
      // First, check for open encounter (active encounter takes precedence)
      const openEncounter = await Encounter.findOne({
        where: {
          patientId,
          endDate: null,
        },
      });
      if (openEncounter) {
        return openEncounter;
      }

      // Then, check for existing form response encounter on the same date
      const recordedDate = dateRecordedValue || responseData.startTime || null;

      if (recordedDate) {
        const whereConditions = {
          patientId,
          encounterType: 'surveyResponse',
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('DATE', Sequelize.col('start_date')),
              Sequelize.fn('DATE', new Date(recordedDate).toISOString()),
            ),
          ],
          ...(responseData.departmentId && { departmentId: responseData.departmentId }),
          ...(responseData.locationId && { locationId: responseData.locationId }),
        };

        const existingFormResponseEncounter = await Encounter.findOne({
          where: whereConditions,
        });

        if (existingFormResponseEncounter) {
          return existingFormResponseEncounter;
        }
      }
    }

    const { departmentId, examinerId, userId, locationId } = responseData;

    const encounterStartDate = dateRecordedValue || responseData.startTime || getCurrentDateTimeString();
    const encounterEndDate = dateRecordedValue || responseData.endTime || getCurrentDateTimeString();

    // need to create a new encounter with examiner set as the user who submitted the survey.
    const newEncounter = await Encounter.create({
      patientId,
      encounterType: 'surveyResponse',
      reasonForEncounter,
      departmentId,
      examinerId: examinerId || userId,
      locationId,
      // Survey responses will usually have a startTime and endTime and we prefer to use that
      // for the encounter to ensure the times are set in the browser timezone
      startDate: encounterStartDate,
      actorId: userId,
    });

    return newEncounter.update({
      endDate: encounterEndDate,
      systemNote: 'Automatically discharged',
      discharge: {
        note: 'Automatically discharged after survey completion',
      },
    });
  }

  static async createWithAnswers(data: {
    answers: any[];
    surveyId: string;
    patientId: string;
    encounterId: string | null;
    forceNewEncounter: boolean;
    facilityId: string;
    [key: string]: any;
  }) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('SurveyResponse.createWithAnswers must always run inside a transaction!');
    }
    const { models } = this.sequelize;
    const {
      answers,
      surveyId,
      patientId,
      encounterId,
      forceNewEncounter,
      facilityId,
      ...responseData
    } = data;

    // ensure survey exists
    const survey = await models.Survey.findByPk(surveyId);
    if (!survey) {
      throw new InvalidOperationError(`Invalid survey ID: ${surveyId}`);
    }

    // figure out if its a vital survey response
    const vitalsSurvey = await models.Survey.getVitalsSurvey();
    // use optional chaining because vitals survey might not exist
    const isVitalSurvey = surveyId === vitalsSurvey?.id;

    const questions = await models.SurveyScreenComponent.getComponentsForSurvey(surveyId);

    const calculatedAnswers = runCalculations(questions, answers);
    const finalAnswers = {
      ...answers,
      ...calculatedAnswers,
    };

    // Determine if this is a chart entry or form response
    const isChartEntry = CHARTING_SURVEY_TYPES.includes(survey.surveyType);
    const reasonForEncounter = isChartEntry ? 'Chart entry' : 'Form response';

    const encounter = await this.getSurveyEncounter({
      encounterId,
      patientId,
      forceNewEncounter,
      reasonForEncounter,
      answers: finalAnswers,
      ...responseData,
    });
    const { result, resultText } = getResultValue(questions, answers, {
      encounterType: encounter.encounterType,
    });
    const record = await SurveyResponse.create({
      patientId,
      surveyId,
      encounterId: encounter.id,
      result,
      resultText,
      // put responseData last to allow for user to override
      // resultText by including it in the data
      // this is used by reports test where the resultText
      // is included in the payload
      ...responseData,
      notified: responseData?.endTime && survey?.notifiable ? false : null,
    });

    const findDataElement = (id: string) => {
      const component = questions.find(c => c.dataElement.id === id);
      if (!component) return null;
      return component.dataElement;
    };

    // create answer records
    for (const a of Object.entries(finalAnswers)) {
      const [dataElementId, value] = a;
      const dataElement = findDataElement(dataElementId);
      if (!dataElement) {
        throw new Error(`no data element for question: ${dataElementId}`);
      }
      const body = await getBodyForAnswer(dataElement.type, value, models);
      // Don't create null answers
      if (body === null) {
        continue;
      }

      const answer = await models.SurveyResponseAnswer.create({
        dataElementId: dataElement.id,
        body,
        responseId: record.id,
      });
      if (!isVitalSurvey || body === '') continue;
      // Generate initial vital log
      await models.VitalLog.create({
        date: record.endTime || getCurrentDateTimeString(),
        newValue: body,
        recordedById: responseData.userId,
        answerId: answer.id,
      });
    }

    await handleSurveyResponseActions(
      models,
      facilityId,
      questions,
      finalAnswers,
      encounter.patientId,
      surveyId,
      responseData.userId,
      responseData.endTime,
    );

    return record;
  }
}
