import { RelationId } from 'typeorm';
import { Entity, ManyToOne, PrimaryColumn, BeforeInsert } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_facility')
export class PatientFacility extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  @BeforeInsert()
  async assignIdAsPatientFacilityId(): Promise<void> {
    // For patient_facilities, we use a composite primary key of patient_id plus facility_id,
    // so that if two users on different devices mark the same patient for sync, the join
    // record is treated as the same record, making the sync merge strategy trivial
    // id is still produced, but just as a deterministically generated convenience column for
    // consistency and to maintain the assumption of "id" existing in various places
    // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
    // to avoid clashes on the joined id

    //patient actually stores the patientId in @BeforeInsert
    this.id = `${this.patient.replace(';', ':')};${this.facility.replace(';', ':')}`;
  }

  static getTableNameForSync(): string {
    return 'patient_facilities';
  }
}
