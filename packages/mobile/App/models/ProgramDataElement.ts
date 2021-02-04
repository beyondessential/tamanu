import { Entity, Column, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { Database } from '~/infra/db';
import { IProgramDataElement } from '~/types';

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel
  implements IProgramDataElement {
  @Column()
  code: string;

  @Column({ nullable: true, default: '' })
  name?: string;

  @Column({ default: '' })
  defaultText: string;

  @Column({ nullable: true })
  defaultOptions?: string;

  @Column()
  type: string;

  @OneToMany(() => SurveyResponseAnswer, answer => answer.dataElement)
  answers: SurveyResponseAnswer[];
}

