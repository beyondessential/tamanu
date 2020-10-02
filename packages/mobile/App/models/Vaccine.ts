import { Entity, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IVaccine } from '~/types';

@Entity('vaccine')
export class Vaccine extends BaseModel implements IVaccine {
  @Column()
  schedule: string[];

  @Column()
  name: string;

  @Column()
  code: string;
}
