import { Entity, Column, ManyToOne, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IAdministeredVaccine, InjectionSiteType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { Location } from './Location';
import { Department } from './Department';
import { ScheduledVaccine } from './ScheduledVaccine';
import { User } from './User';
import { VaccineStatus } from '~/ui/helpers/patient';

@Entity('administered_vaccine')
export class AdministeredVaccine extends BaseModel implements IAdministeredVaccine {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

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
  date: string;

  @Column({ nullable: true })
  givenBy?: string;

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

  @ManyToOne(
    () => User,
    user => user.recordedVaccines,
  )
  recorder: User;

  @RelationId(({ recorder }: AdministeredVaccine) => recorder)
  recorderId: string;

  @ManyToOne(
    () => Location,
    loc => loc.administeredVaccines,
  )
  location: Location;

  @RelationId(({ location }: AdministeredVaccine) => location)
  locationId: string;

  @ManyToOne(
    () => Department,
    dep => dep.administeredVaccines,
  )
  department: Department;

  @RelationId(({ department }: AdministeredVaccine) => department)
  departmentId: string;

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
