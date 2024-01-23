import {
  Column,
  Entity,
  ManyToOne,
  RelationId,
} from 'typeorm/browser';

import { IPatientContact } from '~/types';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('patient_field_value')
export class PatientContact extends BaseModel implements IPatientContact {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: false })
  method: string;

  @Column({ nullable: false })
  address: string;

  @Column({ nullable: true })
  deletionStatus: string;

  @ManyToOne(
    () => Patient,
    patient => patient.contacts,
  )
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @ReferenceDataRelation()
  relationship: ReferenceData;
  @RelationId(({ relationship }) => relationship)
  relationshipId: string;

  static getTableNameForSync(): string {
    return 'patient_contacts';
  }
}
