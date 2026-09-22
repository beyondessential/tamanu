import { Column, Entity, ManyToOne, OneToMany, RelationId, getConnection } from 'typeorm';
import { readConfig } from '~/services/config';
import {
  EncounterType,
  type ICreateSurveyResponse,
  type ISurveyResponse,
  type ISurveyScreenComponent,
} from '~/types';
import { runCalculations } from '~/ui/helpers/calculations';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import {
  FieldTypes,
  getPatientDataDbLocation,
  getResultValue,
  getStringValue,
} from '~/ui/helpers/fields';
import { VisibilityStatus } from '../visibilityStatuses';
import { BaseModel } from './BaseModel';
import { DateTimeStringColumn } from './DateColumns';
import { Encounter } from './Encounter';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { ProgramRegistry } from './ProgramRegistry';
import { Referral } from './Referral';
import { Survey } from './Survey';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { VitalLog } from './VitalLog';
import { SYNC_DIRECTIONS } from './types';

interface RecordValuesByModel {
  Patient?: Record<string, string>;
  PatientAdditionalData?: Record<string, string>;
  PatientProgramRegistration?: Record<string, string>;
}

const getFieldsToWrite = (questions, answers): RecordValuesByModel => {
  const recordValuesByModel = {};

  const patientDataQuestions = questions.filter(
    q => q.dataElement.type === FieldTypes.PATIENT_DATA,
  );
  for (const question of patientDataQuestions) {
    const config = question.getConfigObject();
    const { dataElement } = question;

    if (!config.writeToPatient) {
      // this is just a question that's reading patient data, not writing it
      continue;
    }

    const { fieldName: configFieldName } = config.writeToPatient || {};
    if (!configFieldName) {
      throw new Error('No fieldName defined for writeToPatient config');
    }

    const value = answers[dataElement.code];
    const { modelName, fieldName } = getPatientDataDbLocation(configFieldName);
    if (!modelName) {
      throw new Error(`Unknown fieldName: ${configFieldName}`);
    }
    if (!recordValuesByModel[modelName]) recordValuesByModel[modelName] = {};
    recordValuesByModel[modelName][fieldName] = value;
  }
  return recordValuesByModel;
};

/**
 * DUPLICATED IN shared/models/SurveyResponse.js
 * Please keep in sync
 */
async function writeToPatientFields(
  questions,
  answers,
  patientId,
  surveyId,
  userId,
  submittedTime,
) {
  const valuesByModel = getFieldsToWrite(questions, answers);

  if (valuesByModel.Patient) {
    await Patient.updateValues(patientId, valuesByModel.Patient);
  }

  if (valuesByModel.PatientAdditionalData) {
    await PatientAdditionalData.updateForPatient(patientId, valuesByModel.PatientAdditionalData);
  }

  if (valuesByModel.PatientProgramRegistration) {
    const facilityId = await readConfig('facilityId', '');
    const { programId } = await Survey.findOne({ where: { id: surveyId } });
    const programRegistryDetail = await ProgramRegistry.findOne({
      where: { program: { id: programId }, visibilityStatus: VisibilityStatus.Current },
    });
    if (!programRegistryDetail?.id) {
      throw new Error('No program registry configured for the current form');
    }
    await PatientProgramRegistration.upsertRegistration(
      patientId,
      programRegistryDetail.id,
      {
        ...valuesByModel.PatientProgramRegistration,
        registeringFacilityId:
          valuesByModel.PatientProgramRegistration.registeringFacilityId || facilityId,
        clinicianId: valuesByModel.PatientProgramRegistration.clinicianId || userId,
      },
      submittedTime,
    );
  }
}

export type AnsweredQuestion = {
  question: ISurveyScreenComponent;
  answer: string | null;
};

/**
 * Pairs a survey's questions with the answers recorded against them, keeping only the rows the
 * response details screen displays. Lives here rather than in the screen so that the questions
 * batched for record resolution are exactly the questions rendered.
 */
const pairQuestionsWithAnswers = (
  questions: ISurveyScreenComponent[],
  answers: SurveyResponseAnswer[],
): AnsweredQuestion[] => {
  // Keyed on the foreign key rather than the loaded relation: a soft-deleted data element still
  // has a question (getComponents passes withDeleted) but its relation would not load.
  const answerBodiesByDataElementId = new Map(
    answers.map(answer => [answer.dataElementId, answer.body] as const),
  );

  return questions
    .filter(question => question.dataElement.name)
    .map(question => ({
      question,
      answer: answerBodiesByDataElementId.get(question.dataElement.id) ?? null,
    }))
    .filter(
      ({ question, answer }) =>
        (answer !== null && answer !== '') || question.dataElement.type === FieldTypes.DISPLAY_TEXT,
    );
};

@Entity('survey_responses')
export class SurveyResponse extends BaseModel implements ISurveyResponse {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn({ nullable: true })
  startTime?: string;

  @DateTimeStringColumn({ nullable: true })
  endTime?: string;

  @Column({ default: 0, nullable: true })
  result?: number;

  @Column({ default: '', nullable: true })
  resultText?: string;

  @DateTimeStringColumn({ nullable: true })
  editedTime?: string;

  @Column({ nullable: true })
  notified?: boolean;

  @ManyToOne(() => Survey, survey => survey.responses)
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(() => Encounter, encounter => encounter.surveyResponses)
  encounter: Encounter;

  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @OneToMany(() => Referral, referral => referral.surveyResponse)
  referral: Referral;

  @OneToMany(() => SurveyResponseAnswer, answer => answer.response)
  answers: SurveyResponseAnswer[];

  static async getFullResponse(surveyResponseId: string) {
    const repo = SurveyResponse.getRepository();
    const response = await repo.findOne({
      where: { id: surveyResponseId },
      relations: ['survey', 'encounter', 'encounter.patient'],
    });
    const questions = await response.survey.getComponents({ includeAllVitals: true });
    const answers = await SurveyResponseAnswer.getRepository().find({
      where: {
        response: { id: response.id },
      },
    });

    return {
      ...response,
      answeredQuestions: pairQuestionsWithAnswers(questions, answers),
    };
  }

  static async submit(
    patientId: string,
    userId: string,
    surveyData: ICreateSurveyResponse,
    values: object,
    setNote: (note: string) => void = () => null,
  ): Promise<SurveyResponse> {
    const { surveyId, encounterReason, components, ...otherData } = surveyData;

    const survey = await Survey.findOne({ where: { id: surveyId } });
    if (!survey) throw new Error(`Survey with id ${surveyId} not found`);

    // The try/catch must wrap the transaction, not sit inside its callback: a catch
    // inside the callback that returns normally makes TypeORM COMMIT the partial
    // writes. Letting the error propagate out of the callback rolls the transaction
    // back, then we report the failure to the caller as a null result.
    try {
      return await getConnection().transaction(async () => {
        setNote('Creating encounter...');
        const encounter = await Encounter.getOrCreateCurrentEncounter(patientId, userId, {
          startDate: getCurrentDateTimeString(),
          endDate: getCurrentDateTimeString(),
          encounterType: EncounterType.SurveyResponse,
          reasonForEncounter: encounterReason,
        });

        const calculatedValues = runCalculations(components, values);
        const finalValues = { ...values, ...calculatedValues };

        const { result, resultText } = getResultValue(components, finalValues);

        setNote('Creating response object...');
        const responseRecord: SurveyResponse = await SurveyResponse.createAndSaveOne({
          encounter: encounter.id,
          survey: surveyId,
          startTime: getCurrentDateTimeString(),
          endTime: getCurrentDateTimeString(),
          result,
          resultText,
          ...otherData,
          notified: survey.notifiable ? false : undefined,
        });

        setNote('Attaching answers...');

        // figure out if its a vital survey response
        let vitalsSurvey;
        try {
          vitalsSurvey = await Survey.getVitalsSurvey({ includeAllVitals: false });
        } catch (e) {
          console.error(`Errored while trying to get vitals survey: ${e}`);
        }

        // use optional chaining because vitals survey might not exist
        const isVitalSurvey = surveyId === vitalsSurvey?.id;

        const componentsByCode = new Map(components.map(c => [c.dataElement.code, c]));

        for (const a of Object.entries(finalValues)) {
          const [dataElementCode, value] = a;
          const component = componentsByCode.get(dataElementCode);
          if (!component) {
            // better to fail entirely than save partial data
            throw new Error(
              `no screen component for code: ${dataElementCode}, cannot match to data element`,
            );
          }
          const { dataElement } = component;

          const body = getStringValue(dataElement.type, value);
          // Don't create null answers
          if (body === null) {
            continue;
          }

          setNote(`Attaching answer for ${dataElement.id}...`);
          const answerRecord = await SurveyResponseAnswer.createAndSaveOne({
            dataElement: dataElement.id,
            body,
            response: responseRecord.id,
          });

          if (!isVitalSurvey || body === '') continue;
          setNote(`Attaching initial vital log for ${answerRecord.id}...`);
          await VitalLog.createAndSaveOne({
            date: responseRecord.endTime,
            newValue: body,
            recordedBy: userId,
            answer: answerRecord.id,
          });
        }
        setNote('Writing patient data');

        await writeToPatientFields(
          components,
          finalValues,
          patientId,
          surveyId,
          userId,
          responseRecord.endTime,
        );

        setNote('Done');

        return responseRecord;
      });
    } catch (e) {
      setNote(`Error: ${e.message} (${JSON.stringify(e)})`);
      return null;
    }
  }

  static async getForPatient({
    patientId,
    surveyId,
    limit = 80,
  }: {
    patientId: string;
    surveyId?: string;
    limit?: number;
  }): Promise<SurveyResponse[]> {
    const query = SurveyResponse.getRepository()
      .createQueryBuilder('survey_response')
      // the encounter is only here to filter by patient, so don't pay to hydrate it
      .innerJoin('survey_response.encounter', 'encounter')
      .innerJoinAndSelect('survey_response.survey', 'survey')
      .where('encounter.patientId = :patientId', { patientId })
      // Exclude survey responses linked through procedure_survey_response
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM procedure_survey_responses psr WHERE psr.surveyResponseId = survey_response.id)',
      )
      .orderBy('survey_response.endTime', 'DESC')
      .take(limit);

    if (surveyId) {
      query.andWhere('survey.id = :surveyId', { surveyId: surveyId.toLowerCase() });
    }

    return query.getMany();
  }
}
