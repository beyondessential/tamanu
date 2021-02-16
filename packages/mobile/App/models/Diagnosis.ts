import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
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
  @RelationId(({ diagnosis }) => diagnosis)
  diagnosisId?: string;

  @ManyToOne(() => Encounter, encounter => encounter.diagnoses)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    return this.getRepository()
      .createQueryBuilder('diagnosis')
      .leftJoin('diagnosis.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
