import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Survey, ProgramDataElement } from './Survey';
import { Encounter } from './Encounter';

@Entity('survey_response')
export class SurveyResponse extends BaseModel {

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

}

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel {
  
  @Column()
  name: string;

  @Column()
  body: string;
  
  @ManyToOne(type => SurveyResponse, surveyResponse => surveyResponse.answers)
  response: SurveyResponse;
  
  @ManyToOne(type => ProgramDataElement, dataElement => dataElement.answers)
  dataElement: ProgramDataElement;

}
