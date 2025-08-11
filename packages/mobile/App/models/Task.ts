import { Entity, Column, ManyToOne, JoinColumn, OneToMany, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { User } from './User';
import { ReferenceData } from './ReferenceData';
import { DateTimeStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';
import { TaskDesignation } from './TaskDesignation';

@Entity('tasks')
export class Task extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'text', nullable: false })
  name: string;

  @DateTimeStringColumn({ nullable: false })
  dueTime: string;

  @DateTimeStringColumn({ nullable: true })
  endTime?: string;

  @DateTimeStringColumn({ nullable: false })
  requestTime: string;

  @Column({ type: 'varchar', nullable: false, default: 'todo' })
  status: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'decimal', nullable: true })
  frequencyValue?: number;

  @Column({ type: 'varchar', nullable: true })
  frequencyUnit?: string;

  @Column({ type: 'decimal', nullable: true })
  durationValue?: number;

  @Column({ type: 'varchar', nullable: true })
  durationUnit?: string;

  @Column({ type: 'boolean', nullable: true })
  highPriority?: boolean;

  @Column({ type: 'varchar', nullable: true })
  parentTaskId?: string;
  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask?: Task;

  @DateTimeStringColumn({ nullable: true })
  completedTime?: string;

  @Column({ type: 'text', nullable: true })
  completedNote?: string;

  @DateTimeStringColumn({ nullable: true })
  notCompletedTime?: string;

  @DateTimeStringColumn({ nullable: true })
  todoTime?: string;

  @Column({ type: 'text', nullable: true })
  todoNote?: string;

  @DateTimeStringColumn({ nullable: true })
  deletedTime?: string;

  @Column({ type: 'varchar', nullable: false, default: 'normal_task' })
  taskType: string;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  @ManyToOne(() => User)
  requestedByUser: User;
  @RelationId(({ requestedByUser }) => requestedByUser)
  requestedByUserId?: string;

  @ManyToOne(() => User)
  completedByUser: User;
  @RelationId(({ completedByUser }) => completedByUser)
  completedByUserId?: string;

  @ManyToOne(() => User)
  notCompletedByUser: User;
  @RelationId(({ notCompletedByUser }) => notCompletedByUser)
  notCompletedByUserId?: string;

  @ManyToOne(() => User)
  todoByUser: User;
  @RelationId(({ todoByUser }) => todoByUser)
  todoByUserId?: string;

  @ManyToOne(() => User)
  deletedByUser: User;
  @RelationId(({ deletedByUser }) => deletedByUser)
  deletedByUserId?: string;

  @ManyToOne(() => ReferenceData)
  notCompletedReason: ReferenceData;
  @RelationId(({ notCompletedReason }) => notCompletedReason)
  notCompletedReasonId?: string;

  @ManyToOne(() => ReferenceData)
  deletedReason: ReferenceData;
  @RelationId(({ deletedReason }) => deletedReason)
  deletedReasonId?: string;

  @ManyToOne(() => ReferenceData)
  deletedReasonForSync: ReferenceData;
  @RelationId(({ deletedReasonForSync }) => deletedReasonForSync)
  deletedReasonForSyncId?: string;

  @OneToMany(() => TaskDesignation, taskDesignation => taskDesignation.task)
  designations: TaskDesignation[];
}
