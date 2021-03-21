import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

@Entity('program')
export class Program extends BaseModel {
  @Column({ nullable: true })
  name: string;

  surveys: any;
}
