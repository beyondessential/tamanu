
import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ILabTest, Status } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { OneToMany } from 'typeorm';
import { User } from './User';
import { LabRequest } from './LabRequest';
import { LabTestType } from './LabTestType';

@Entity('labTest')
export class LabTest extends BaseModel implements ILabTest {
  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @Column({ nullable: false, default: () => "now()" })
  sampleTime: Date;

  
  @Column({ type: 'varchar', nullable: false, default: Status.RECEPTION_PENDING })
  status: Status; // Use different status!!
  
  @Column({ type: 'varchar', nullable: false, default: '' })
  result: String; // Use different status!!

  @ManyToOne(() => LabRequest, labRequest => labRequest.tests)
  labRequest: LabRequest;
  @RelationId(({ labRequest }) => labRequest)
  labRequestId?: string;
  
  @ReferenceDataRelation()
  category: ReferenceData;
  @RelationId(({ category }) => category)
  categoryId?: string;

  @ManyToOne(() => LabTestType)
  labTestType: LabTestType;
  @RelationId(({ labTestType }) => labTestType)
  labTestTypeId?: string;

  // static getListReferenceAssociations() {
  //   return ['category', 'labTestType'];
  // 
}