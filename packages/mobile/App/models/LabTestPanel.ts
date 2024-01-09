import { Entity, Column, ManyToMany, JoinTable } from 'typeorm/browser';

import { ILabTestPanel } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { LabTestType } from './LabTestType';

@Entity('lab_test_panel')
export class LabTestPanel extends BaseModel implements ILabTestPanel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  code: string;

  @Column({ type: 'varchar', nullable: false, default: VisibilityStatus.Current })
  visibilityStatus?: VisibilityStatus;

  @ManyToMany(
    () => LabTestType,
    labTestType => labTestType.labTestPanels,
  )
  @JoinTable({
    name: 'lab_test_panel_lab_test_types',
  })
  tests: LabTestType[];
}
