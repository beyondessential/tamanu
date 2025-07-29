import { ManyToOne, RelationId, Entity, Column } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { Prescription } from './Prescription';

@Entity('encounter_prescriptions')
export class EncounterPrescription extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false, default: false })
  isSelectedForDischarge: boolean;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(() => Prescription)
  prescription: Prescription;
  @RelationId(({ prescription }) => prescription)
  prescriptionId: string;
}
