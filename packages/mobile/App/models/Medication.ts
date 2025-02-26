import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IMedication } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Encounter } from './Encounter';
import { DateTimeStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';

@Entity('encounter_medications')
export class Medication extends BaseModel implements IMedication {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn()
  date: string;

  @DateTimeStringColumn({ nullable: true })
  endDate?: string;

  @Column({ nullable: true })
  prescription?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  indication?: string;

  @Column({ nullable: true })
  route?: string;

  @Column()
  quantity: number;

  @ReferenceDataRelation()
  medication: ReferenceData;
  @RelationId(({ medication }) => medication)
  medicationId?: string;

  @ManyToOne(() => Encounter, (encounter) => encounter.medications)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  // These qty fields are not required on web but not on mobile,
  // leaving them in for parity with web for now.
  @Column({ nullable: true })
  qtyMorning?: number;

  @Column({ nullable: true })
  qtyLunch?: number;

  @Column({ nullable: true })
  qtyEvening?: number;

  @Column({ nullable: true })
  qtyNight?: number;
}
