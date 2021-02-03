import { Entity, Column, ManyToOne, BeforeUpdate } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IAdministeredVaccine } from '~/types';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';

@Entity('administered_vaccine')
export class AdministeredVaccine extends BaseModel implements IAdministeredVaccine {
  @Column({ nullable: true })
  batch?: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  location: string;

  @Column()
  date: Date;

  @ManyToOne(() => Encounter, encounter => encounter.administeredVaccines)
  encounter: Encounter;

  @ManyToOne(() => ScheduledVaccine, scheduledVaccine => scheduledVaccine.administeredVaccine)
  scheduledVaccine: ScheduledVaccine;

  @BeforeUpdate()
  markEncounterForUpload() {
    this.encounter.markedForUpload = true;
    this.encounter.save();
  }

  static async getForPatient(patientId: string): Promise<IAdministeredVaccine[]> {
    return this.getRepository()
      .createQueryBuilder('administered_vaccine')
      .leftJoinAndSelect('administered_vaccine.encounter', 'encounter')
      .leftJoinAndSelect('administered_vaccine.scheduledVaccine', 'scheduledVaccine')
      .leftJoinAndSelect('scheduledVaccine.vaccine', 'vaccine')
      .where('encounter.patient.id = :patient', { patient: patientId })
      .getMany();
  }
}
