import { ManyToOne, Column, Entity, RelationId, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceDataRelation, ReferenceDataRelationType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceData } from './ReferenceData';

@Entity('reference_data_relations')
export class ReferenceDataRelation extends BaseModel implements IReferenceDataRelation {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar' })
  type: ReferenceDataRelationType;

  // PARENTS
  @ManyToOne(() => ReferenceData, (referenceData) => referenceData.children)
  referenceDataParent: ReferenceData;
  @JoinColumn({ name: 'referenceDataParentId' })
  @RelationId(({ referenceDataParent }) => referenceDataParent)
  referenceDataParentId: string;

  // CHILDREN
  @ManyToOne(() => ReferenceData, (referenceData) => referenceData.parents)
  referenceData: ReferenceData;
  @RelationId(({ referenceData }) => referenceData)
  referenceDataId: string;
  @JoinColumn({ name: 'referenceDataId' })
  static getTableNameForSync(): string {
    return 'reference_data_relations';
  }
}
