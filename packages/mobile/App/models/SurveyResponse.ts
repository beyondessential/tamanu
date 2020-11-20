import { Entity, Column, ManyToOne } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { Encounter } from './Encounter';

import { ISurveyResponse } from '~/types';

@Entity('survey_response')
export class SurveyResponse extends BaseModel implements ISurveyResponse {
  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  result: number;

  @ManyToOne(type => Survey, survey => survey.responses)
  survey: Survey;

  @ManyToOne(type => Encounter, encounter => encounter.surveyResponses)
  encounter: Encounter;

  static async getFullResponse(surveyId: string) {
    const repo = this.getRepository();
    const response = await repo.findOne(surveyId, {
      relations: ['survey', 'encounter', 'encounter.patient'],
    });
    const questions = await response.survey.getComponents();
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

  static async submit(patientId, surveyData, values): Promise<SurveyResponse> {
    const { surveyId, encounterReason, ...otherData } = surveyData;

    const encounter = await Encounter.create({
      patient: patientId,
      startDate: new Date(),
      endDate: new Date(),
      encounterType: 'surveyResponse',
      reasonForEncounter: encounterReason,
    });

    const responseRecord = await SurveyResponse.create({
      encounter: encounter.id,
      startTime: Date.now(),
      endTime: Date.now(),
      survey: surveyId,
      ...otherData,
    });

    const answers = await Promise.all(
      Object.entries(values).map(([dataElementId, value]) => SurveyResponseAnswer.create({
        dataElementId,
        body: `${value}`,
        response: responseRecord.id,
      })),
    );

    return responseRecord;
  }
}

