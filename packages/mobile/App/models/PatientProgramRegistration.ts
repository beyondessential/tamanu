import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import { IPatientProgramRegistration } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';

@Entity('patient_program_registration')
export class PatientProgramRegistration extends BaseModel implements IPatientProgramRegistration {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

}
