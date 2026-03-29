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

    const placeholders = questionCodes.map(() => '?').join(', ');
    const rows: { code: string; body: string }[] = await this.getRepository().query(
      `SELECT de.code, sra.body
       FROM survey_response_answers sra
       JOIN survey_responses sr ON sra.response_id = sr.id
       JOIN encounters e ON sr.encounter_id = e.id
       JOIN program_data_elements de ON sra.data_element_id = de.id
       WHERE e.patient_id = ?
         AND de.code IN (${placeholders})
       ORDER BY sr.start_time DESC`,
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
