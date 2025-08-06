import { Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Task } from './Task';
import { EncounterPrescription } from './EncounterPrescription';

@Entity('task_encounter_prescriptions')
export class TaskEncounterPrescription extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Task)
  task: Task;
  @RelationId(({ task }) => task)
  taskId: string;

  @ManyToOne(() => EncounterPrescription)
  encounterPrescription: EncounterPrescription;
  @RelationId(({ encounterPrescription }) => encounterPrescription)
  encounterPrescriptionId: string;
} 