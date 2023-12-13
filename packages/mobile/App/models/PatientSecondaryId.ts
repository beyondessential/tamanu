import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { IPatientSecondaryId } from '~/types';
import { BaseModel, IdRelation } from './BaseModel';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_secondary_id')
export class PatientSecondaryId extends BaseModel implements IPatientSecondaryId {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column()
  value: string;

  @Column()
  visibilityStatus: string;

  @ReferenceDataRelation()
  type: ReferenceData;
  @IdRelation()
  typeId: string;

  @ManyToOne(
    () => Patient,
    patient => patient.secondaryIds,
  )
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }
}
