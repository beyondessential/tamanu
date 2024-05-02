import { Column, Entity } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { ManyToOne } from 'typeorm';
import { IReferenceDataRelation, ReferenceDataRelationType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceData } from './ReferenceData';

@Entity('reference_data_relation')
export class ReferenceDataRelation extends BaseModel implements IReferenceDataRelation {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column()
  id: string;

  @Column({ type: 'varchar' })
  type: ReferenceDataRelationType;

  @ManyToOne(
    () => ReferenceData,
    referenceData => referenceData.children,
  )
  public parent: ReferenceData;

  @ManyToOne(
    () => ReferenceData,
    referenceData => referenceData.parents,
  )
  public child: ReferenceData;

  static getTableNameForSync(): string {
    return 'reference_data_relation';
  }
}
