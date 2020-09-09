import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IPatient } from '~/types';

@Entity('patient')
export class Patient extends BaseModel implements IPatient {
  bloodType: string;

  telephone: string;

  city: string;

  encounters: any[];

  @Column()
  displayId: string;

  @Column()
  firstName: string;

  @Column()
  middleName: string;

  @Column()
  lastName: string;

  @Column()
  culturalName: string;

  @Column()
  dateOfBirth: Date;

  @Column()
  sex: string;
}
