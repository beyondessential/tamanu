import { Column, Entity, RelationId, OneToMany, ManyToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { DateTimeStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';
import { EncounterPrescription } from './EncounterPrescription';
import { User } from './User';

@Entity('prescriptions')
export class Prescription extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn()
  date: string;

  @DateTimeStringColumn({ nullable: true })
  endDate?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  indication?: string;

  @Column({ nullable: true })
  route?: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  discontinued?: boolean;

  @Column({ nullable: true })
  discontinuingReason?: string;

  @DateTimeStringColumn({ nullable: true })
  discontinuedDate?: string;

  @Column({ nullable: true })
  repeats?: number;

  @Column({ nullable: true })
  isOngoing?: boolean;

  @Column({ nullable: true })
  isPrn?: boolean;

  @Column({ nullable: true })
  isVariableDose?: boolean;

  @Column({ nullable: true })
  doseAmount?: number;

  @Column()
  units: string;

  @Column()
  frequency: string;

  @DateTimeStringColumn()
  startDate: string;

  @Column({ nullable: true })
  durationValue?: number;

  @Column({ nullable: true })
  durationUnit?: string;

  @Column({ nullable: true })
  isPhoneOrder?: boolean;

  @Column({ nullable: true })
  idealTimes?: string;

  @Column({ nullable: true })
  pharmacyNotes?: string;

  @Column({ nullable: true })
  displayPharmacyNotesInMar?: boolean;

  @OneToMany(
    () => EncounterPrescription,
    encounterPrescription => encounterPrescription.prescription,
  )
  encounterPrescriptions: EncounterPrescription[];

  @ManyToOne(() => User)
  prescriber: User;
  @RelationId(({ prescriber }) => prescriber)
  prescriberId: string;

  @ManyToOne(() => User)
  discontinuingClinician: User;
  @RelationId(({ discontinuingClinician }) => discontinuingClinician)
  discontinuingClinicianId: string;

  @ReferenceDataRelation()
  medication: ReferenceData;
  @RelationId(({ medication }) => medication)
  medicationId?: string;

  static sanitizeRecordDataForPush(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert idealTimes to ARRAY because central server expects it to be ARRAY
      sanitizedRow.data.idealTimes = row.data.idealTimes ? row.data.idealTimes.split(',') : [];

      return sanitizedRow;
    });
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert idealTimes to string because Sqlite does not support ARRAY type
      if (row.data.idealTimes) {
        sanitizedRow.data.idealTimes = sanitizedRow.data.idealTimes.join(',');
      }

      return sanitizedRow;
    });
  }
}
