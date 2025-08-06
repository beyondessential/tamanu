import { Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Task } from './Task';
import { ReferenceData } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';

@Entity('task_designations')
export class TaskDesignation extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Task)
  task: Task;
  @RelationId(({ task }) => task)
  taskId?: string;

  @ManyToOne(() => ReferenceData)
  designation: ReferenceData;
  @RelationId(({ designation }) => designation)
  designationId?: string;
}
