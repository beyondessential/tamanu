import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';

import { BaseModel } from './BaseModel';
import { ProgramDataElement } from './ProgramDataElement';
import { SurveyResponse } from './SurveyResponse';
import { VitalLog } from './VitalLog';

import { ISurveyResponseAnswer } from '~/types';
import { SYNC_DIRECTIONS } from './types';

@Entity('survey_response_answers')
export class SurveyResponseAnswer extends BaseModel implements ISurveyResponseAnswer {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  body?: string;

  @ManyToOne(() => SurveyResponse, (surveyResponse) => surveyResponse.answers)
  response: SurveyResponse;

  @RelationId(({ response }) => response)
  responseId: string;

  @ManyToOne(() => ProgramDataElement, (dataElement) => dataElement.answers)
  dataElement: ProgramDataElement;

  @RelationId(({ dataElement }) => dataElement)
  dataElementId: string;

  @OneToMany(() => VitalLog, (vitalLog) => vitalLog.answer)
  vitalLogs: VitalLog[];

  static async getLatestAnswerForPatient(
    patientId: string,
    dataElementCode: string,
  ): Promise<ISurveyResponseAnswer> {
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

  /**
   * Returns map of question code -> most recent answer body for a patient.
   * Fetches all matching codes in a single query, picking the latest per code.
   */
  static async getLastAnswerValuesByQuestionCodes(
    patientId: string,
    questionCodes: string[],
  ): Promise<Record<string, string>> {
    if (!questionCodes.length) return {};

    const codePlaceholders = questionCodes.map((_, i) => `$${i + 2}`).join(', ');
    const rows: { code: string; body: string }[] = await this.getRepository().query(
      `
      SELECT pde.code, answer.body
      FROM survey_response_answers answer
      INNER JOIN survey_responses response
        ON response.id = answer.responseId
      INNER JOIN encounters encounter
        ON encounter.id = response.encounterId
      INNER JOIN program_data_elements pde
        ON pde.id = answer.dataElementId
      WHERE encounter.patientId = $1
        AND pde.code IN (${codePlaceholders})
        AND answer.body IS NOT NULL
        AND answer.body != ''
        AND answer.deletedAt IS NULL
      ORDER BY response.startTime DESC
    `,
      [patientId, ...questionCodes],
    );

    const valuesByCode: Record<string, string> = {};
    for (const row of rows) {
      if (valuesByCode[row.code] === undefined) {
        valuesByCode[row.code] = row.body ?? '';
      }
    }
    return valuesByCode;
  }
}
