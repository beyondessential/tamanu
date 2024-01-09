import { Entity, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('program')
export class Program extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  name?: string;

  surveys: any;
}
