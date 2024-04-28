import { Column, Entity } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferenceDataRelation, ReferenceDataRelationType } from '~/types';
import { SYNC_DIRECTIONS } from './types';

@Entity('reference_data_relation')
export class ReferenceDataRelation extends BaseModel implements IReferenceDataRelation {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column()
  id: string;

  @Column({ type: 'varchar' })
  type: ReferenceDataRelationType;

  static getTableNameForSync(): string {
    return 'reference_data_relation';
  }
}
