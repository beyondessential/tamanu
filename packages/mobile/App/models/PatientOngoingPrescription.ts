import { ManyToOne, RelationId } from 'typeorm';
import { Entity, PrimaryColumn } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Prescription } from './Prescription';
import { Patient } from './Patient';

@Entity('patient_ongoing_prescriptions')
export class PatientOngoingPrescription extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Patient)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => Prescription)
  prescription: Prescription;
  @RelationId(({ prescription }) => prescription)
  prescriptionId: string;
}
