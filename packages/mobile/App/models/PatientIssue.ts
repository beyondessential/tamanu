import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { IPatientIssue, PatientIssueType } from '~/types';
import { BaseModel } from './BaseModel';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';
import { DateTimeStringColumn } from './DateColumns';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';

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
