import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
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

  @Column({ type: 'varchar', nullable: false, default: 'normal-task' })
  taskType: string;

  // Relations
  @Column({ type: 'varchar', nullable: true })
  encounterId?: string;
  @ManyToOne(() => Encounter, { nullable: true })
  @JoinColumn({ name: 'encounterId' })
  encounter?: Encounter;

  @Column({ type: 'varchar', nullable: true })
  requestedByUserId?: string;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedByUserId' })
  requestedBy?: User;

  @Column({ type: 'varchar', nullable: true })
  completedByUserId?: string;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completedByUserId' })
  completedBy?: User;

  @Column({ type: 'varchar', nullable: true })
  notCompletedByUserId?: string;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'notCompletedByUserId' })
  notCompletedBy?: User;

  @Column({ type: 'varchar', nullable: true })
  todoByUserId?: string;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'todoByUserId' })
  todoBy?: User;

  @Column({ type: 'varchar', nullable: true })
  deletedByUserId?: string;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deletedByUserId' })
  deletedBy?: User;

  @Column({ type: 'varchar', nullable: true })
  notCompletedReasonId?: string;
  @ManyToOne(() => ReferenceData, { nullable: true })
  @JoinColumn({ name: 'notCompletedReasonId' })
  notCompletedReason?: ReferenceData;

  @Column({ type: 'varchar', nullable: true })
  deletedReasonId?: string;
  @ManyToOne(() => ReferenceData, { nullable: true })
  @JoinColumn({ name: 'deletedReasonId' })
  deletedReason?: ReferenceData;

  @Column({ type: 'varchar', nullable: true })
  deletedReasonForSyncId?: string;
  @ManyToOne(() => ReferenceData, { nullable: true })
  @JoinColumn({ name: 'deletedReasonForSyncId' })
  deletedReasonForSync?: ReferenceData;

  @OneToMany(() => TaskDesignation, taskDesignation => taskDesignation.task)
  designations: TaskDesignation[];
}
