import { Entity, Column, ManyToOne, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IAdministeredVaccine, InjectionSiteType } from '~/types';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';

@Entity('administered_vaccine')
export class AdministeredVaccine extends BaseModel implements IAdministeredVaccine {
  @Column({ nullable: true })
  batch?: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ type: 'varchar', nullable: true }) // <- QUESTION: other enums specify 'text' or 'type: varchar'. Why, and should we?
  injectionSite?: InjectionSiteType;
  
  @Column({ nullable: true })
  location?: string;

  @Column()
  date: Date;

  @ManyToOne(() => Encounter, encounter => encounter.administeredVaccines)
  encounter: Encounter;

  @RelationId(({ encounter }: AdministeredVaccine) => encounter)
  encounterId: string;

  @ManyToOne(() => ScheduledVaccine, scheduledVaccine => scheduledVaccine.administeredVaccines)
  scheduledVaccine: ScheduledVaccine;

  @RelationId(({ scheduledVaccine }: AdministeredVaccine) => scheduledVaccine)
  scheduledVaccineId: string;

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParent(Encounter, 'encounter', 'markedForUpload');
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
