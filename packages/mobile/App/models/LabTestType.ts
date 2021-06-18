
import { Entity, Column, RelationId } from 'typeorm/browser';

import { ILabTestType, LabTestQuestionType } from "~/types";
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('labTestType')
export class LabTestType extends BaseModel implements ILabTestType {

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false, default: '' })
  name: string;

  @Column({ nullable: false, default: '' })
  unit: string;

  @Column({ nullable: true })
  maleMin?: number;

  @Column({ nullable: true })
  maleMax?: number;

  @Column({ nullable: true })
  femaleMin?: number;

  @Column({ nullable: true })
  femaleMax?: number;

  @Column({ nullable: true })
  rangeText?: string;

  @Column({ type: 'varchar', nullable: false, default: LabTestQuestionType.NUMBER })
  questionType: LabTestQuestionType;

  @Column({ nullable: true })
  options?: string;

  // TODO: What to do with relations with no "as"
  @ReferenceDataRelation()
  category: ReferenceData;
  @RelationId(({ category }) => category)
  labTestCategoryId: string;
}
