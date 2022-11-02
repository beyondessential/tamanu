import { Entity, Column, ManyToOne, RelationId, BeforeUpdate, BeforeInsert } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { IPatientIssue, PatientIssueType } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';

@Entity('patient_issue')
export class PatientIssue extends BaseModel implements IPatientIssue {
  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
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

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  // TODO: add everything below here to a mixin
  // https://www.typescriptlang.org/docs/handbook/mixins.html

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding an issue to a patient should mark them for syncing in future
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      await Patient.markForSync(parent.id);
    }
  }
}
