import { ID } from './ID';
import { ISurveyResponseAnswer } from './ISurveyResponse';
import { IUser } from './IUser';

export interface IVitalLog {
  id: ID;

  date: string;
  previousValue: string;
  newValue: string;
  reasonForChange: string;

  recordedBy: IUser;
  recordedById: string;

  answer: ISurveyResponseAnswer;
  answerId: string;
}
