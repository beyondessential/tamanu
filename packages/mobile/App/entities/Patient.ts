import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IPatient } from '~/types';

@Entity('patient')
export class Patient extends BaseModel implements IPatient {

  @Column()
  displayId: string;

  @Column()
  firstName: string;

  @Column()
  middlename: string;

  @Column()
  lastName: string;

  @Column()
  culturalName: string;

  @Column()
  lastDate: Date;  

  @Column()
  dateOfBirth: Date;

  @Column()
  sex: string; 
}
