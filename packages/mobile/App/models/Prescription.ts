import { Column, Entity, RelationId, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IMedication } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { DateTimeStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';
import { EncounterPrescription } from './EncounterPrescription';

@Entity('prescriptions')
export class Prescription extends BaseModel implements IMedication {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn()
  date: string;

  @DateTimeStringColumn({ nullable: true })
  endDate?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  indication?: string;

  @Column({ nullable: true })
  route?: string;

  @Column()
  quantity: number;

  @OneToMany(
    () => EncounterPrescription,
    encounterPrescription => encounterPrescription.prescription,
  )
  encounterPrescriptions: EncounterPrescription[];

  @ReferenceDataRelation()
  medication: ReferenceData;
  @RelationId(({ medication }) => medication)
  medicationId?: string;
}
