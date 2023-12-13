import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';

import { ILabTest, LabTestStatus } from '~/types';
import { BaseModel } from './BaseModel';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';
import { DateStringColumn } from './DateColumns';
import { LabRequest } from './LabRequest';
import { LabTestType } from './LabTestType';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';

@Entity('labTest')
export class LabTest extends BaseModel implements ILabTest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @DateStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: string;

  @Column({ type: 'varchar', nullable: false, default: LabTestStatus.RECEPTION_PENDING })
  status: LabTestStatus;

  @Column({ type: 'varchar', nullable: false, default: '' })
  result: string;

  @ManyToOne(
    () => LabRequest,
    labRequest => labRequest.tests,
  )
  labRequest: LabRequest;
  @RelationId(({ labRequest }) => labRequest)
  labRequestId: string;

  @ReferenceDataRelation()
  category: ReferenceData;
  @RelationId(({ category }) => category)
  categoryId: string;

  @ManyToOne(() => LabTestType)
  labTestType: LabTestType;
  @RelationId(({ labTestType }) => labTestType)
  labTestTypeId: string;

  static getTableNameForSync(): string {
    return 'lab_tests'; // unusual camel case table here on mobile
  }
}
