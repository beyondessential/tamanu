import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IImmunisation } from '~/types';
import { Encounter } from './Encounter';

@Entity('immunisation')
export class Immunisation extends BaseModel implements IImmunisation {
  @Column()
  schedule: string;

  @Column()
  vaccine: string;

  @Column()
  batch: string;

  @Column()
  timeliness: string;

  @Column()
  date: Date;

  @ManyToOne(type => Encounter, encounter => encounter.vaccine)
  encounter: Encounter;

  static async getForPatient(patientId: string): Promise<Immunisation[]> {
    return this.getRepository()
      .createQueryBuilder('immunisation')
      .leftJoin('immunisation.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
