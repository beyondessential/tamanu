import { Entity, Column, ManyToOne, OneToMany, RelationId } from 'typeorm/browser';

import { ISurveyResponse, ICreateSurveyResponse } from '~/types/ISurveyResponse';
import { SurveyScreenConfig } from '~/types/ISurvey';
import { EncounterType } from '~/types/IEncounter';

import { getStringValue, getResultValue, isCalculated, FieldTypes } from '~/ui/helpers/fields';

import { runCalculations } from '~/ui/helpers/calculations';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { Encounter } from './Encounter';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { Referral } from './Referral';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { VitalLog } from './VitalLog';
import { SYNC_DIRECTIONS } from './types';
import { DateTimeStringColumn } from './DateColumns';

@Entity('survey_response')
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

  @ManyToOne(
    () => Survey,
    survey => survey.responses,
  )
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(
    () => Encounter,
    encounter => encounter.surveyResponses,
  )
  encounter: Encounter;

  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @OneToMany(
    () => Referral,
    referral => referral.surveyResponse,
  )
  referral: Referral;

  @OneToMany(
    () => SurveyResponseAnswer,
    answer => answer.response,
  )
  answers: SurveyResponseAnswer[];

  static async getFullResponse(surveyId: string) {
    const repo = this.getRepository();
    const response = await repo.findOne(surveyId, {
      relations: ['survey', 'encounter', 'encounter.patient'],
    });
    const questions = await response.survey.getComponents({ includeAllVitals: true });
    const answers = await SurveyResponseAnswer.getRepository().find({
      where: {
        response: response.id,
      },
      relations: ['dataElement'],
    });

    return {
      ...response,
      questions: [...questions],
      answers: [...answers],
    };
  }

  static async submit(
    patientId: string,
    userId: string,
    surveyData: ICreateSurveyResponse,
    values: object,
    setNote: (note: string) => void = () => null,
  ): Promise<SurveyResponse | null> {
    const { surveyId, encounterReason, components, ...otherData } = surveyData;

    try {
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
      });

      setNote('Attaching answers...');

      // these will store values to write to patient records following submission
      const patientRecordValues = {};
      const patientAdditionalDataValues = {};

      // TODO: this should just look at the field name and decide; there will never be overlap
      const isAdditionalDataField = (questionConfig: SurveyScreenConfig) =>
        Boolean(questionConfig.writeToPatient?.isAdditionalDataField);

      // figure out if its a vital survey response
      let vitalsSurvey;
      try {
        vitalsSurvey = await Survey.getVitalsSurvey();
      } catch (e) {
        console.error(`Errored while trying to get vitals survey: ${e}`);
      }

      // use optional chaining because vitals survey might not exist
      const isVitalSurvey = surveyId === vitalsSurvey?.id;

      for (const a of Object.entries(finalValues)) {
        const [dataElementCode, value] = a;
        const component = components.find(c => c.dataElement.code === dataElementCode);
        if (!component) {
          // better to fail entirely than save partial data
          throw new Error(
            `no screen component for code: ${dataElementCode}, cannot match to data element`,
          );
        }
        const { dataElement } = component;

        if (isCalculated(dataElement.type) && value !== 0 && !value) {
          // calculated values will always be in the answer object - but we
          // shouldn't save null answers
          continue;
        }

        if (dataElement.type === FieldTypes.PATIENT_DATA) {
          const questionConfig = component.getConfigObject();
          const fieldName = questionConfig.writeToPatient?.fieldName;
          if (fieldName) {
            if (isAdditionalDataField(questionConfig)) {
              patientAdditionalDataValues[fieldName] = value;
            } else {
              patientRecordValues[fieldName] = value;
            }
          }
        }

        setNote(`Attaching answer for ${dataElement.id}...`);
        const body = getStringValue(dataElement.type, value);
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
      setNote('Done');

      // Save values to database records
      if (Object.keys(patientRecordValues).length) {
        await Patient.updateValues(patientId, patientRecordValues);
      }
      if (Object.keys(patientAdditionalDataValues).length) {
        await PatientAdditionalData.updateForPatient(patientId, patientAdditionalDataValues);
      }

      return responseRecord;
    } catch (e) {
      const msg = `Error: ${e.message} (${JSON.stringify(e)})`;
      console.error(msg);
      setNote(msg);

      return null;
    }
  }

  static async getForPatient(patientId: string, surveyId?: string): Promise<SurveyResponse[]> {
    const query = this.getRepository()
      .createQueryBuilder('survey_response')
      .leftJoinAndSelect('survey_response.encounter', 'encounter')
      .leftJoinAndSelect('survey_response.survey', 'survey')
      .where('encounter.patientId = :patientId', { patientId })
      .orderBy('survey_response.endTime', 'DESC')
      .take(80);

    if (surveyId) {
      query.andWhere('survey.id = :surveyId', { surveyId: surveyId.toLowerCase() });
    }

    return query.getMany();
  }
}
