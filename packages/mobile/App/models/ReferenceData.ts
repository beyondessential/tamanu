import { Column, Entity, Like } from 'typeorm/browser';
import { ManyToOne, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType } from '~/types';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceDataRelation } from '~/models/ReferenceDataRelation';

@Entity('reference_data')
export class ReferenceData extends BaseModel implements IReferenceData {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'varchar' })
  type: ReferenceDataType;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  @OneToMany(
    () => ReferenceDataRelation,
    entity => entity.children,
  )
  public children: ReferenceDataRelation[];

  @OneToMany(
    () => ReferenceDataRelation,
    entity => entity.parent,
  )
  public parents: ReferenceDataRelation[];

  static async getAnyOfType(referenceDataType: ReferenceDataType): Promise<ReferenceData | null> {
    const repo = this.getRepository();

    return repo.findOne({
      type: referenceDataType,
      visibilityStatus: VisibilityStatus.Current,
    });
  }

  // ----------------------------------
  // Reference data hierarchy utilities
  // ----------------------------------
  static async getParent(id, relationType) {
    const record = await this.getNode({ where: { id }, relationType });
    return record?.parent;
  }

  static async getNode({ where, relationType }) {
    const repo = this.getRepository();

    const result = await repo.findOne(
      { visibilityStatus: VisibilityStatus.Current, type: 'village', id: 'village-Tai' },
      {
        relations: ['parents'],
      },
    );

    console.log('RESULT', result);
    return result;
  }

  async getAncestors(relationType) {
    const repo = this.getRepository();
    // Todo: write recursive function to get all ancestors
    return ['village', 'division'];
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
        visibilityStatus: VisibilityStatus.Current,
      },
      skip: 0,
      take: limit,
    });
  }

  static async getSelectOptionsForType(
    referenceDataType: ReferenceDataType,
  ): Promise<{ label: string; value: string }[]> {
    const repo = this.getRepository();

    const results = await repo.find({
      where: {
        type: referenceDataType,
        visibilityStatus: VisibilityStatus.Current,
      },
    });

    return results.map(r => ({ label: r.name, value: r.id }));
  }

  static getTableNameForSync(): string {
    return 'reference_data';
  }
}

export const ReferenceDataRelation = (): any =>
  ManyToOne(() => ReferenceData, undefined, { eager: true });

export const NullableReferenceDataRelation = (): any =>
  ManyToOne(() => ReferenceData, undefined, { eager: true, nullable: true });
