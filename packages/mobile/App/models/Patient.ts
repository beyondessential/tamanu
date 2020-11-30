import { Entity, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IPatient } from '~/types';

@Entity('patient')
export class Patient extends BaseModel implements IPatient {
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
  bloodType: string;

  @Column()
  sex: string;

  //----------------------------------------------------------
  // sync info

  @Column({ default: 0 })
  lastSynced: Date;

  @Column({ default: false })
  markedForSync: boolean;

  static async markForSync(patientId: string): Promise<Patient> {
    const repo = this.getRepository();

    return repo.update(patientId, { markedForSync: true });
  }
}
