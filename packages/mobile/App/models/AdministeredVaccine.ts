import { Entity, Column, ManyToOne, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IAdministeredVaccine, InjectionSiteType } from '~/types';
import { Encounter } from './Encounter';
import { ScheduledVaccine } from './ScheduledVaccine';
import { VaccineStatus } from '~/ui/helpers/patient';

@Entity('administered_vaccine')
export class AdministeredVaccine extends BaseModel implements IAdministeredVaccine {
  @Column({ nullable: true })
  batch?: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ type: 'varchar', nullable: true })
  injectionSite?: InjectionSiteType;

  @Column({ nullable: true, default: true })
  consent: boolean;

  @Column()
  date: Date;

  @ManyToOne(
    () => Encounter,
    encounter => encounter.administeredVaccines,
  )
  encounter: Encounter;

  @RelationId(({ encounter }: AdministeredVaccine) => encounter)
  encounterId: string;

  @ManyToOne(
    () => ScheduledVaccine,
    scheduledVaccine => scheduledVaccine.administeredVaccines,
  )
  scheduledVaccine: ScheduledVaccine;

  @RelationId(({ scheduledVaccine }: AdministeredVaccine) => scheduledVaccine)
  scheduledVaccineId: string;

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParentForUpload(Encounter, 'encounter');
  }

  static async getForPatient(patientId: string): Promise<IAdministeredVaccine[]> {
    return this.getRepository()
      .createQueryBuilder('administered_vaccine')
      .leftJoinAndSelect('administered_vaccine.encounter', 'encounter')
      .leftJoinAndSelect('encounter.location', 'location')
      .leftJoinAndSelect('encounter.examiner', 'examiner')
      .leftJoinAndSelect('administered_vaccine.scheduledVaccine', 'scheduledVaccine')
      .leftJoinAndSelect('scheduledVaccine.vaccine', 'vaccine')
      .where('encounter.patient.id = :patient', { patient: patientId })
      .andWhere('administered_vaccine.status IN (:...status)', {
        status: [VaccineStatus.GIVEN, VaccineStatus.NOT_GIVEN],
      })
      .getMany();
  }
}
