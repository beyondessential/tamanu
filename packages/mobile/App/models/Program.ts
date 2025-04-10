import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { ProgramRegistry } from './ProgramRegistry';
import { SYNC_DIRECTIONS } from './types';

@Entity('programs')
export class Program extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  name?: string;

  @OneToMany(() => Survey, ({ program }) => program)
  surveys: Survey[];

  @OneToOne(() => ProgramRegistry, ({ program }) => program)
  registry: ProgramRegistry;
}
