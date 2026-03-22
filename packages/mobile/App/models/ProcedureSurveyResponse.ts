import { Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Procedure } from './Procedure';
import { SurveyResponse } from './SurveyResponse';
import { SYNC_DIRECTIONS } from './types';
import { IProcedureSurveyResponse } from '~/types/IProcedureSurveyResponse';

@Entity('procedure_survey_responses')
export class ProcedureSurveyResponse extends BaseModel implements IProcedureSurveyResponse {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Procedure)
  procedure: Procedure;
  @RelationId(({ procedure }) => procedure)
  procedureId: string;

  @ManyToOne(() => SurveyResponse)
  surveyResponse: SurveyResponse;
  @RelationId(({ surveyResponse }) => surveyResponse)
  surveyResponseId: string;
}
