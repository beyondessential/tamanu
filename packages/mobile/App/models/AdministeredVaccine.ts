import { Entity, Column, ManyToOne, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';
import { BaseModel, IdRelation } from './BaseModel';
import { IAdministeredVaccine, InjectionSiteType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { Location } from './Location';
import { Department } from './Department';
import { ScheduledVaccine } from './ScheduledVaccine';
import { User } from './User';
import { VaccineStatus } from '~/ui/helpers/patient';
import { ReferenceData, NullableReferenceDataRelation } from './ReferenceData';

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

  @Column({ nullable: true, default: false })
  givenElsewhere: boolean;

  @Column({ nullable: true, default: true })
  consent: boolean;

  @Column({ nullable: true })
  consentGivenBy?: string;

  @Column({ nullable: true })
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

  @NullableReferenceDataRelation()
  notGivenReason?: ReferenceData;

  @IdRelation()
  notGivenReasonId?: string | null;

  @Column({ nullable: true })
  circumstanceIds?: string;

  @Column({ nullable: true })
  disease?: string;

  @Column({ nullable: true })
  vaccineBrand?: string;

  @Column({ nullable: true })
  vaccineName?: string;

  static async getForPatient(patientId: string): Promise<IAdministeredVaccine[]> {
    return this.getRepository()
      .createQueryBuilder('administered_vaccine')
      .leftJoinAndSelect('administered_vaccine.encounter', 'encounter')
      .leftJoinAndSelect('encounter.examiner', 'examiner')
      .leftJoinAndSelect('administered_vaccine.notGivenReason', 'notGivenReason')
      .leftJoinAndSelect('administered_vaccine.scheduledVaccine', 'scheduledVaccine')
      .leftJoinAndSelect('administered_vaccine.location', 'location')
      .leftJoinAndSelect('administered_vaccine.department', 'department')
      .leftJoinAndSelect('location.locationGroup', 'locationGroup')
      .leftJoinAndSelect('scheduledVaccine.vaccine', 'vaccine')
      .where('encounter.patient.id = :patient', { patient: patientId })
      .andWhere('administered_vaccine.status IN (:...status)', {
        status: [VaccineStatus.GIVEN, VaccineStatus.NOT_GIVEN],
      })
      .getMany();
  }

  static sanitizeRecordDataForPush(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };

      // Convert circumstanceIds to ARRAY because central server expects it to be ARRAY
      if (row.data.circumstanceIds) {
        sanitizedRow.data.circumstanceIds = sanitizedRow.data.circumstanceIds.split(',');
      }

      return sanitizedRow;
    });
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };

      // Convert circumstanceIds to string because Sqlite does not support ARRAY type
      if (row.data.circumstanceIds) {
        sanitizedRow.data.circumstanceIds = sanitizedRow.data.circumstanceIds.join(',');
      }

      return sanitizedRow;
    });
  }
}
