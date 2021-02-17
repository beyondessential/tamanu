import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { IPatientIssue, PatientIssueType } from '~/types';

@Entity('patient_issue')
export class PatientIssue extends BaseModel implements IPatientIssue {
  @Column()
  note?: string;

  @Column()
  recordedDate: Date;

  @Column('text')
  type: PatientIssueType;

  @ManyToOne(() => Patient, patient => patient.issues)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;
}
