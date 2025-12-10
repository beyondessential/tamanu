import { BeforeInsert, Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel, IdRelation } from './BaseModel';
import { Patient } from './Patient';
import { User } from './User';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';
import { DateTimeStringColumn } from './DateColumns';

@Entity('patient_allergies')
export class PatientAllergy extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  note?: string;

  @DateTimeStringColumn({ nullable: false })
  recordedDate: string;

  @ManyToOne(() => Patient, (patient) => patient.allergies)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => User)
  practitioner?: User;
  @RelationId(({ practitioner }) => practitioner)
  practitionerId?: string;

  @ReferenceDataRelation()
  allergy?: ReferenceData;
  @IdRelation()
  allergyId?: string;

  @ReferenceDataRelation()
  reaction?: ReferenceData;
  @IdRelation()
  reactionId?: string;

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patientId);
  }
}
