/* eslint-disable @typescript-eslint/no-use-before-define */
import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Survey, ProgramDataElement } from './Survey';
import { Encounter } from './Encounter';

import { ISurveyResponse, ISurveyResponseAnswer } from '~/types';

@Entity('survey_response')
export class SurveyResponse extends BaseModel implements ISurveyResponse {
  surveyId: string;

  encounterId: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  result: number;

  @ManyToOne(
    type => Survey,
    survey => survey.responses,
  )
  survey: Survey;

  @ManyToOne(
    type => Encounter,
    encounter => encounter.surveyResponses,
  )
  encounter: Encounter;

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
      Object.entries(values).map(([dataElementId, value]) =>
        SurveyResponseAnswer.create({
          dataElementId,
          body: `${value}`,
          response: responseRecord.id,
        }),
      ),
    );

    return responseRecord;
  }
}

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel
  implements ISurveyResponseAnswer {
  @Column()
  body: string;

  @ManyToOne(
    type => SurveyResponse,
    surveyResponse => surveyResponse.answers,
  )
  response: SurveyResponse;

  @ManyToOne(
    type => ProgramDataElement,
    dataElement => dataElement.answers,
  )
  dataElement: ProgramDataElement;
}
