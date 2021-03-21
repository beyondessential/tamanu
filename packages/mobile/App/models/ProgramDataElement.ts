import { Entity, Column, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { Database } from '~/infra/db';
import { IProgramDataElement, DataElementType } from '~/types';

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel
  implements IProgramDataElement {
  @Column({ nullable: true })
  code: string;

  @Column({ default: '', nullable: true })
  name?: string;

  @Column({ default: '', nullable: true })
  defaultText: string;

  @Column({ nullable: true })
  defaultOptions?: string;

  @Column('text')
  type: DataElementType;

  @OneToMany(() => SurveyResponseAnswer, answer => answer.dataElement)
  answers: SurveyResponseAnswer[];
}
