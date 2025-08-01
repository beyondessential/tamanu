import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceData } from './ReferenceData';
import { ID } from '~/types';

@Entity('reference_drugs')
export class ReferenceDrug extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar', nullable: true })
  route: string;

  @Column({ type: 'varchar', nullable: true })
  units: string;

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isSensitive: boolean;

  @OneToOne(() => ReferenceData, referenceData => referenceData.referenceDrug)
  @JoinColumn()
  referenceData: ReferenceData;
  @RelationId((referenceDrug: ReferenceDrug) => referenceDrug.referenceData)
  referenceDataId: ID;
}
