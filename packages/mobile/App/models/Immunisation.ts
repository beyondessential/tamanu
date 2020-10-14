import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IImmunisation } from '~/types';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';

@Entity('immunisation')
export class Immunisation extends BaseModel implements IImmunisation {
  @Column()
  batch: string;

  @Column()
  timeliness: string;

  @Column()
  date: Date;

  @ManyToOne(type => Encounter, encounter => encounter.vaccine)
  encounter: Encounter;

  @ManyToOne(type => ScheduledVaccine)
  scheduledVaccine: ScheduledVaccine;

  static async getForPatient(patientId: string): Promise<Immunisation[]> {
    return this.getRepository()
      .createQueryBuilder('immunisation')
      .leftJoin('immunisation.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
