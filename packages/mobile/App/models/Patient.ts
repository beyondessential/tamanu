import { readConfig } from '~/services/config';
import { Entity, Column, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { Referral } from './Referral';
import { PatientIssue } from './PatientIssue';
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
  markedForSync: boolean; // TODO: should markedForUpload on children cascade upward to this?

  @Column({ type: 'bigint', default: 0 })
  lastSynced: number;

  @OneToMany(() => Encounter, encounter => encounter.patient)
  encounters: Encounter[]

  @OneToMany(() => Referral, referral => referral.patient)
  referrals: Referral[]

  @OneToMany(() => PatientIssue, issue => issue.patient)
  issues: PatientIssue[]

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

  static async getSyncable(): Promise<Patient[]> {
    return this.getRepository().createQueryBuilder('patient')
      .leftJoin('patient.encounters', 'encounter')
      .where('patient.markedForSync = :marked', { marked: true })
      .orWhere('encounter.markedForUpload = :marked', { marked: true })
      .getMany();
  }
}
