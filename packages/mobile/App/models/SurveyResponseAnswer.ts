import { Entity, Column, ManyToOne, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ProgramDataElement } from './ProgramDataElement';
import { SurveyResponse } from './SurveyResponse';

import { ISurveyResponseAnswer } from '~/types';

@Entity('survey_response_answer')
export class SurveyResponseAnswer extends BaseModel
  implements ISurveyResponseAnswer {

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  body?: string;

  @ManyToOne(() => SurveyResponse, surveyResponse => surveyResponse.answers)
  response: SurveyResponse;

  @RelationId(({ response }) => response)
  responseId: string;

  @ManyToOne(() => ProgramDataElement, dataElement => dataElement.answers)
  dataElement: ProgramDataElement;

  @RelationId(({ dataElement }) => dataElement)
  dataElementId: string;

  @BeforeInsert()
  @BeforeUpdate()
  async markResponseForUpload() {
    await this.markParent(SurveyResponse, 'response', 'markedForUpload');
  }

  static async getLatestAnswerForPatient(patientId: string, dataElementCode: string): Promise<ISurveyResponseAnswer> {
    return this.getRepository()
      .createQueryBuilder('survey_response_answer')
      .leftJoin('survey_response_answer.response', 'response')
      .leftJoin('response.encounter', 'encounter')
      .leftJoin('survey_response_answer.dataElement', 'dataElement')
      .where('encounter.patientId = :patientId', { patientId })
      .andWhere('dataElement.code = :dataElementCode', { dataElementCode })
      .orderBy('response.startTime', 'DESC')
      .getOne();
  }
}
