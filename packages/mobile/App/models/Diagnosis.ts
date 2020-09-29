import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IDiagnosis, Certainty } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('diagnosis')
export class Diagnosis extends BaseModel implements IDiagnosis {
  @Column()
  isPrimary: boolean;

  @Column()
  date: Date;

  @Column({ type: 'varchar' })
  certainty: Certainty;

  @ReferenceDataRelation()
  diagnosis: ReferenceData;

  @ManyToOne(type => Encounter, encounter => encounter.diagnosis)
  encounter: Encounter;

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    return this.getRepository()
      .createQueryBuilder('diagnosis')
      .leftJoin('diagnosis.encounter', 'encounter')
      .where('encounter.patient = :patient', { patient: patientId })
      .getMany();
  }
}
