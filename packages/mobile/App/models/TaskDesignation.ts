import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Task } from './Task';
import { ReferenceData } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';

@Entity('task_designations')
export class TaskDesignation extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar', nullable: false })
  taskId: string;
  @ManyToOne(() => Task, { nullable: false })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'varchar', nullable: false })
  designationId: string;
  @ManyToOne(() => ReferenceData, { nullable: false })
  @JoinColumn({ name: 'designationId' })
  designation: ReferenceData;
}
