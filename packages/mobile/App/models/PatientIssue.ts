import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { IPatientIssue, PatientIssueType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';
import { DateTimeStringColumn } from './DateColumns';

@Entity('patient_issue')
export class PatientIssue extends BaseModel implements IPatientIssue {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  note?: string;

  @DateTimeStringColumn({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
  recordedDate: string;

  @Column('text')
  type: PatientIssueType;

  @ManyToOne(
    () => Patient,
    patient => patient.issues,
  )
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }
}
