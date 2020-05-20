import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';

@Entity('patient')
export class Patient {
  @PrimaryGeneratedColumn()
  id: string;

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
  dateOfBirth: string;

  @Column()
  sex: string; 
}
