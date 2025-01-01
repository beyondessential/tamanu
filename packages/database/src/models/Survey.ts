import { SURVEY_TYPES } from '@tamanu/constants';
import { Model } from './Model';

export class Survey extends Model {
  programId?: string;
  notifiable!: string;

  static getVitalsSurvey() {
    return this.findOne({
      where: { surveyType: SURVEY_TYPES.VITALS },
    });
  }
}
