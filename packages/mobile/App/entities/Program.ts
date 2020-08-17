import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseEntity } from './BaseEntity';

@Entity('program')
export class Program extends BaseEntity {

  @Column()
  name: string;

}
