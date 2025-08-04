import { BeforeInsert, Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel, IdRelation } from './BaseModel';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { IPatientSecondaryId } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';

@Entity('patient_secondary_ids')
export class PatientSecondaryId extends BaseModel implements IPatientSecondaryId {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column()
  value: string;

  @Column()
  visibilityStatus: VisibilityStatus;

  @ReferenceDataRelation()
  type: ReferenceData;
  @IdRelation()
  typeId: string;

  @ManyToOne(() => Patient, patient => patient.secondaryIds)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }
}
