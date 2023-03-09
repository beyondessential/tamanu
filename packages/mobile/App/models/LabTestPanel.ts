import { Entity, Column, ManyToOne, RelationId, OneToOne } from 'typeorm/browser';

import { ILabTestPanel } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { LabTest } from './LabTest';


@Entity('lab_test_panel')
export class LabTestPanel extends BaseModel implements ILabTestPanel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

    @Column({ type: 'varchar', nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: false })
    code: string;

    @Column({ type: 'varchar', nullable: false, default: VisibilityStatus.Current })
    visibilityStatus?: VisibilityStatus;

    @OneToOne(
        () => LabTest,
        labTest => labTest.labTestPanel,
      )
      tests: LabTest[];
}
