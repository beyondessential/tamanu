import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { ILabTest } from '~/types';
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { LabRequest } from './LabRequest';
import { LabTestType } from './LabTestType';
import { SYNC_DIRECTIONS } from './types';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';
import { DateStringColumn } from './DateColumns';

@Entity('lab_tests')
export class LabTest extends BaseModel implements ILabTest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @DateStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  result: string;

  @Column({ type: 'text', nullable: true })
  secondaryResult?: string;

  @ManyToOne(() => LabRequest, (labRequest) => labRequest.tests)
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
}
