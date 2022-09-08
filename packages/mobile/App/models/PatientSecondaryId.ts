import { Entity, Column, ManyToOne, RelationId, BeforeUpdate, BeforeInsert } from 'typeorm/browser';
import { BaseModel, IdRelation } from './BaseModel';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { IPatientSecondaryId } from '~/types';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_secondary_id')
export class PatientSecondaryId extends BaseModel implements IPatientSecondaryId {
  @Column()
  value: string;

  @Column()
  visibilityStatus: string;

  @ReferenceDataRelation()
  type: ReferenceData;
  @IdRelation()
  typeId: string;

  @ManyToOne(() => Patient, patient => patient.secondaryIds)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding a secondary ID to a patient should mark them for syncing in future
    // we don't need to upload the patient, so we only set markedForSync
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      await Patient.markForSync(parent.id)
    }
  }
}
