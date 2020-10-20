import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IMedication } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Encounter } from './Encounter';

@Entity('medication')
export class Medication extends BaseModel implements IMedication {
  @Column()
  date: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  prescription?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  indication?: string;

  @Column({ nullable: true })
  route?: string;

  // This quantity column is required on mobile but doesn't exist on desktop.
  @Column()
  quantity: number;

  // These qty fields are not required on desktop but not on mobile,
  // leaving them in for parity with desktop for now.
  @Column({ nullable: true })
  qtyMorning?: number;

  @Column({ nullable: true })
  qtyLunch?: number;

  @Column({ nullable: true })
  qtyEvening?: number;

  @Column({ nullable: true })
  qtyNight?: number;

  @ReferenceDataRelation()
  medication: ReferenceData;

  @ManyToOne(type => Encounter, encounter => encounter.medication)
  encounter: Encounter;
}
