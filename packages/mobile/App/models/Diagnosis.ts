import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { Certainty, IDiagnosis } from '~/types';
import { BaseModel } from './BaseModel';
import { DateTimeStringColumn } from './DateColumns';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';

@Entity('diagnosis')
export class Diagnosis extends BaseModel implements IDiagnosis {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  isPrimary?: boolean;

  @DateTimeStringColumn()
  date: string;

  @Column({ type: 'varchar', nullable: true })
  certainty?: Certainty;

  @ReferenceDataRelation()
  diagnosis: ReferenceData;
  @RelationId(({ diagnosis }) => diagnosis)
  diagnosisId?: string;

  @ManyToOne(
    () => Encounter,
    encounter => encounter.diagnoses,
  )
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  static getTableNameForSync(): string {
    return 'encounter_diagnoses';
  }

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    return this.getRepository()
      .createQueryBuilder('diagnosis')
      .leftJoin('diagnosis.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
