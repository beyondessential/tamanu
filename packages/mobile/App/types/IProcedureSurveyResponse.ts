export interface IProcedureSurveyResponse {
  id: string;
  procedureId: string;
  surveyResponseId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  updatedAtSyncTick: number;
}
