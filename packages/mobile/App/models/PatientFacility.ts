import { RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_facility')
export class PatientFacility extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Patient)
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => Facility)
  facility: Facility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  static getPluralTableName(): string {
    return 'patient_facilities';
  }
}
