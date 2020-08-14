import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseEntity } from './BaseEntity';

@Entity('program')
export class ProgramEntity extends BaseEntity {

  @Column()
  name: string;

}
