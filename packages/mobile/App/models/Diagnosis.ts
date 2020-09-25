import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IDiagnosis, Certainty } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('diagnosis')
export class Diagnosis extends BaseModel implements IDiagnosis {
  @Column()
  certainty: Certainty;

  @Column()
  isPrimary: boolean;

  @Column()
  date: Date;

  @ManyToOne(type => Encounter, encounter => encounter.diagnosis)
  encounter: Encounter;

  @ReferenceDataRelation()
  diagnosis: ReferenceData;

  static async getForPatient(patientId: string): Promise<Diagnosis[]> {
    const repo = this.getRepository();

    return repo.find({
      patient: patientId,
    });
  }
}
