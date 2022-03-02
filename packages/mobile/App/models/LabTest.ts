import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ILabTest, LabTestStatus } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { LabRequest } from './LabRequest';
import { LabTestType } from './LabTestType';

@Entity('labTest')
export class LabTest extends BaseModel implements ILabTest {
  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @Column({ nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  sampleTime: Date;

  @Column({ type: 'varchar', nullable: false, default: LabTestStatus.RECEPTION_PENDING })
  status: LabTestStatus;

  @Column({ type: 'varchar', nullable: false, default: '' })
  result: string;

  @ManyToOne(() => LabRequest, labRequest => labRequest.tests)
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
