import { Entity, Column, Like } from 'typeorm/browser';
import { ManyToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType } from '~/types';
import { VisibilityStatus } from '../visibilityStatuses';

@Entity('reference_data')
export class ReferenceData extends BaseModel implements IReferenceData {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'varchar' })
  type: ReferenceDataType;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  static async getAnyOfType(referenceDataType: ReferenceDataType): Promise<ReferenceData | null> {
    const repo = this.getRepository();

    return repo.findOne({
      type: referenceDataType,
    });
  }

  static async searchDataByType(
    referenceDataType: ReferenceDataType,
    searchTerm: string,
    limit = 10,
  ): Promise<ReferenceData[]> {
    const repo = this.getRepository();

    return repo.find({
      where: {
        name: Like(`%${searchTerm}%`),
        type: referenceDataType,
      },
      skip: 0,
      take: limit,
    });
  }

  static getPluralTableName(): string {
    return 'reference_data';
  };
}

export const ReferenceDataRelation = (): any => ManyToOne(
  () => ReferenceData,
  undefined,
  { eager: true },
);

export const NullableReferenceDataRelation = (): any => ManyToOne(
  () => ReferenceData,
  undefined,
  { eager: true, nullable: true },
);
