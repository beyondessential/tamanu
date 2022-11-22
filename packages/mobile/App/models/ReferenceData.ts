import { Entity, Column, Like } from 'typeorm/browser';
import { ManyToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType } from '~/types';
import { VisibilityStatus } from '../visibilityStatuses';
import { VISIBILITY_STATUSES } from '~/ui/helpers/constants';

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
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
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
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      skip: 0,
      take: limit,
    });
  }
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
