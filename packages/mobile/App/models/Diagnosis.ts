import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IDiagnosis, Certainty } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('diagnosis')
export class Diagnosis extends BaseModel implements IDiagnosis {
  @Column({ nullable: true })
  isPrimary?: boolean;

  @Column()
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  certainty?: Certainty;

  @ReferenceDataRelation()
  diagnosis: ReferenceData;
  @RelationId(({ diagnosis }) => diagnosis)
  diagnosisId?: string;

  @ManyToOne(() => Encounter, encounter => encounter.diagnoses)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParentForUpload(Encounter, 'encounter');
  }

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    return this.getRepository()
      .createQueryBuilder('diagnosis')
      .leftJoin('diagnosis.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
