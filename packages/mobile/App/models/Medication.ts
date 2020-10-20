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

  @Column()
  prescription: string;

  @Column()
  note: string;

  @Column()
  indication: string;

  @Column()
  route: string;

  @Column()
  quantity: number;

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
