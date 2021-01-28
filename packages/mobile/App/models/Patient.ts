import { readConfig } from '~/services/config';
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

  // TODO: can sync-related fields + functions be removed, moved into BaseModel, and/or unified?
  @Column({ default: 0 })
  lastSynced: Date;

  @Column({ default: false })
  markedForSync: boolean;

  static async markForSync(patientId: string): Promise<void> {
    const repo = this.getRepository();

    await repo.update(patientId, { markedForSync: true });
  }

  static async findRecentlyViewed(): Promise<Patient[]> {
    const patientIds: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));
    if (patientIds.length === 0) return [];

    const list = await this.getRepository().findByIds(patientIds);

    return patientIds
      // map is needed to make sure that patients are in the same order as in recentlyViewedPatients
      // (typeorm findByIds doesn't guarantee return order)
      .map(storedId => list.find(({ id }) => id === storedId))
      // filter removes patients who couldn't be found (which occurs when a patient was deleted)
      .filter(patient => !!patient);
  }
}
