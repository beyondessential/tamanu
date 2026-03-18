import { Column, Entity, ManyToMany, RelationId } from 'typeorm';

import { ILabTestType, LabTestResultType } from '~/types';
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';
import { LabTestPanel } from './LabTestPanel';

@Entity('lab_test_types')
export class LabTestType extends BaseModel implements ILabTestType {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

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

  @Column({ type: 'varchar', nullable: false, default: LabTestResultType.NUMBER })
  resultType: LabTestResultType;

  @Column({ nullable: true })
  options?: string;

  @ManyToMany(() => LabTestPanel, (labTestPanel) => labTestPanel.tests)
  labTestPanels: LabTestPanel[];

  // TODO: What to do with relations with no "as"
  @ReferenceDataRelation()
  labTestCategory: ReferenceData;
  @RelationId(({ labTestCategory }) => labTestCategory)
  labTestCategoryId: string;

  @Column({ nullable: false, default: false })
  isSensitive: boolean;

  @Column({ nullable: false, default: false })
  supportsSecondaryResults: boolean;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;
}
