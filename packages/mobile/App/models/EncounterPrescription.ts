import { ManyToOne, RelationId, Entity, Column, OneToMany } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { Prescription } from './Prescription';
import { TaskEncounterPrescription } from './TaskEncounterPrescription';

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

  @OneToMany(() => TaskEncounterPrescription, taskEncounterPrescription => taskEncounterPrescription.encounterPrescription)
  taskEncounterPrescriptions: TaskEncounterPrescription[];
}
