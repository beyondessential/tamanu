
import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';

import { ILabTestType, LabTestQuestionType } from "~/types";
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
@Entity('labTestType')
export class LabTestType extends BaseModel implements ILabTestType {

  @Column({ nullable: false })
  code: String;

  @Column({ nullable: false, default: '' })
  name: String;

  @Column({ nullable: false, default: '' })
  unit: String;

  @Column({ nullable: true })
  maleMin: number;

  @Column({ nullable: true })
  maleMax: number;

  @Column({ nullable: true })
  femaleMin: number;

  @Column({ nullable: true })
  femaleMax: number;

  @Column({ nullable: true })
  rangeText: String;

  @Column({ type: 'varchar', nullable: false, default: LabTestQuestionType.NUMBER })
  questionType: LabTestQuestionType;

  @Column({ nullable: true })
  options: String;

  @ReferenceDataRelation()
  category: ReferenceData; // No "as" in original...
  @RelationId(({ category }) => category)
  labTestCategoryId?: string;
}