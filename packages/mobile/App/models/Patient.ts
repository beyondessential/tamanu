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

  static async mapMarkedForSyncIds(
    callback: (patientId: string) => Promise<void> | void,
    limit: number = 100,
  ) {
    let baseQuery = this.getRepository().createQueryBuilder('patient')
      .select('patient.id AS id')
      .distinctOn(['id'])
      .orderBy('id')
      .where('patient.markedForSync = ?', [true])
      .limit(limit);
    let lastSeenId: string = null;
    do {
      const query = lastSeenId ? baseQuery.andWhere('id > ?', [lastSeenId]) : baseQuery;
      const patients = await query.getRawMany();
      const patientIds = patients.map(({ id }) => id);
      lastSeenId = patientIds[patientIds.length - 1];
      for (const patientId of patientIds) {
        await callback(patientId);
      }
    } while (!!lastSeenId);
  }
}
