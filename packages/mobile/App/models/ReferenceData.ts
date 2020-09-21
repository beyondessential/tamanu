import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm/browser';
import { ManyToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType } from '~/types';

@Entity('reference_data')
export class ReferenceData extends BaseModel implements IReferenceData {

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'varchar' })
  type: ReferenceDataType;

}

export const ReferenceDataRelation = (): any => ManyToOne(
  type => ReferenceData,
  undefined,
  { eager: true },
);
