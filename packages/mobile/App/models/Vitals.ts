import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AVPUType, IVitals } from '~/types';
import { Encounter } from './Encounter';

@Entity('vitals')
export class Vitals extends BaseModel implements IVitals {
  @Column()
  date: Date;

  @Column({ type: 'int', nullable: true })
  weight?: number;

  @Column({ type: 'int', nullable: true })
  height?: number;

  @Column({ type: 'int', nullable: true })
  sbp?: number;

  @Column({ type: 'int', nullable: true })
  dbp?: number;

  @Column({ type: 'int', nullable: true })
  heartRate?: number;

  @Column({ type: 'int', nullable: true })
  respiratoryRate?: number;

  @Column({ type: 'int', nullable: true })
  temperature?: number;

  @Column({ type: 'int', nullable: true })
  svO2?: number;

  @Column({ type: 'varchar', nullable: true })
  avpu?: AVPUType;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  static async getForPatient(patientId: string): Promise<Vitals[]> {
    return this.getRepository()
      .createQueryBuilder('vitals')
      .leftJoin('vitals.encounter', 'encounter')
      .where('encounter.patient = :patient', { patient: patientId })
      .getMany();
  }
}
