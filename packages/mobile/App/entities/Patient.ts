import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseEntity } from './BaseEntity';
import { PatientModel } from '/root/models';

@Entity('patient')
export class Patient extends BaseEntity implements PatientModel {

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
