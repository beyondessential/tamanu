import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Certainty, IDiagnosis } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { DateTimeStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';
import { User } from './User';

@Entity('encounter_diagnoses')
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

  @ManyToOne(() => Encounter, (encounter) => encounter.diagnoses)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  @ManyToOne(() => User)
  clinician: User;
  @RelationId(({ clinician }) => clinician)
  clinicianId: string;

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    return this.getRepository()
      .createQueryBuilder('diagnosis')
      .leftJoin('diagnosis.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .getMany();
  }
}
