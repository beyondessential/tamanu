import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';

import { User } from './User';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { IVitalLog } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';
import { DateStringColumn } from './DateColumns';

@Entity('vital_log')
export class VitalLog extends BaseModel implements IVitalLog {
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;

  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @DateStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: string;

  @Column({ type: 'varchar', nullable: true })
  previousValue: string;

  @Column({ type: 'varchar', nullable: true })
  newValue: string;

  @Column({ type: 'varchar', nullable: true })
  reasonForChange: string;

  @ManyToOne(
    () => User,
    user => user.vitalLogs,
  )
  recordedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  recordedById: string;

  @ManyToOne(
    () => SurveyResponseAnswer,
    surveyResponseAnswer => surveyResponseAnswer.vitalLogs,
  )
  answer: SurveyResponseAnswer;
  @RelationId(({ answer }) => answer)
  answerId: string;
}
