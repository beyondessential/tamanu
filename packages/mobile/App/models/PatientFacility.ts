import { BeforeInsert, Entity, ManyToOne, PrimaryColumn, RelationId, Column } from 'typeorm';

import { Database } from '../infra/db';
import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';
import { CURRENT_SYNC_TIME } from '../services/sync/constants';
import { getSyncTick } from '../services/sync/utils';

@Entity('patient_facilities')
export class PatientFacility extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastInteractedTime: Date;

  @Column({
    type: 'bigint',
    default: '0',
  })
  createdAtSyncTick: string;

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
    this.id = `${this.patient.replaceAll(';', ':')};${this.facility.replaceAll(';', ':')}`;
  }

  static async createOrUpdate({ patientId, facilityId }: Partial<PatientFacility>) {
    const syncTick = await getSyncTick(Database.models, CURRENT_SYNC_TIME);
    const record = await super.findOne({
      where: { patient: { id: patientId }, facility: { id: facilityId } },
    });
    if (record) {
      return super.updateValues(record.id, {
        lastInteractedTime: new Date(),
      });
    }
    return super.createAndSaveOne({
      patient: patientId,
      facility: facilityId,
      createdAtSyncTick: syncTick,
    });
  }
}     
