import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferral } from '~/types';
import { Encounter } from './Encounter';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @Column()
  referralNumber: string;

  @Column()
  date: Date;

  @Column()
  referredTo: string;

  @ManyToOne(type => Encounter, encounter => encounter.referral)
  encounter: Encounter;
}
