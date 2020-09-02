import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Survey, ProgramDataElement } from './Survey';
import { Encounter } from './Encounter';

import { ISurveyResponse, ISurveyResponseAnswer } from '~/types';

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

  static async submit(surveyId, selectedPatientId, values) {
    const encounter = await Encounter.create({
      patient: selectedPatientId,
      startDate: new Date(),
      endDate: new Date(),
      encounterType: 'surveyResponse',
      reasonForEncounter: 'Survey response',
    });

    const responseRecord = await SurveyResponse.create({
      survey: surveyId,
      encounter: encounter.id,
      result: Math.random() * 100.0,
      startTime: Date.now(),
      endTime: Date.now(),
    });

    const answers = await Promise.all(
      Object.entries(values).map(([dataElementId, value]) => (
        SurveyResponseAnswer.create({
          dataElementId,
          name: "",
          body: `${value}`,
          response: responseRecord.id,
        })
      ))
    );
  }
}

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel implements ISurveyResponseAnswer {
 
  @Column()
  name: string;

  @Column()
  body: string;
  
  @ManyToOne(type => SurveyResponse, surveyResponse => surveyResponse.answers)
  response: SurveyResponse;
  
  @ManyToOne(type => ProgramDataElement, dataElement => dataElement.answers)
  dataElement: ProgramDataElement;

}
