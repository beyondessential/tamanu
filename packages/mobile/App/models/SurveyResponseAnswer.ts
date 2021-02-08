import { Entity, Column, ManyToOne, BeforeUpdate, RelationId } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ProgramDataElement } from './ProgramDataElement';
import { SurveyResponse } from './SurveyResponse';

import { ISurveyResponseAnswer } from '~/types';

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel
  implements ISurveyResponseAnswer {

  @Column({ nullable: true })
  name: string;

  @Column()
  body: string;

  @ManyToOne(() => SurveyResponse, surveyResponse => surveyResponse.answers)
  response: SurveyResponse;

  @RelationId(({ response }) => response)
  responseId: string;

  @ManyToOne(() => ProgramDataElement, dataElement => dataElement.answers)
  dataElement: ProgramDataElement;

  @RelationId(({ dataElement }) => dataElement)
  dataElementId: string;

  @BeforeUpdate()
  async markResponseForUpload() {
    await this.markParentForUpload(SurveyResponse, this.response);
  }
}
