import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import { IPatientProgramRegistrationCondition } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';

@Entity('patient_program_registration_condition')
export class PatientProgramRegistrationCondition extends BaseModel implements IPatientProgramRegistrationCondition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

}
