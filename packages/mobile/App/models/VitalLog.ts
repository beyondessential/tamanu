import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';

import { IVitalLog } from '~/types';
import { BaseModel } from './BaseModel';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';
import { DateStringColumn } from './DateColumns';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { SYNC_DIRECTIONS } from './types';
import { User } from './User';

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
    user => user.recordedVitalLogs,
  )
  recordedBy: User;
  @RelationId(({ recordedBy }) => recordedBy)
  recordedById: string;

  @ManyToOne(
    () => SurveyResponseAnswer,
    surveyResponseAnswer => surveyResponseAnswer.vitalLogs,
  )
  answer: SurveyResponseAnswer;
  @RelationId(({ answer }) => answer)
  answerId: string;
}
