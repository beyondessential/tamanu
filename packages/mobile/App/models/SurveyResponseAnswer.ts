
import { Entity, Column, ManyToOne } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ProgramDataElement } from './ProgramDataElement';
import { SurveyResponse } from './SurveyResponse';

import { ISurveyResponseAnswer } from '~/types';

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel
  implements ISurveyResponseAnswer {
  @Column()
  body: string;

  @ManyToOne(type => SurveyResponse, surveyResponse => surveyResponse.answers)
  response: SurveyResponse;

  @ManyToOne(type => ProgramDataElement, dataElement => dataElement.answers)
  dataElement: ProgramDataElement;
}
