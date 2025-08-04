import { Column, Entity, ManyToOne, OneToMany, Like, OneToOne } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType, ReferenceDataRelationType } from '~/types';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceDataRelation as RefDataRelation } from './ReferenceDataRelation';
import { ReferenceDrug } from './ReferenceDrug';

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
  visibilityStatus: VisibilityStatus;

  @OneToMany(() => RefDataRelation, entity => entity.referenceDataParent)
  public children: RefDataRelation[];
  @OneToMany(() => RefDataRelation, entity => entity.referenceData)
  public parents: RefDataRelation[];

  @OneToOne(() => ReferenceDrug, referenceDrug => referenceDrug.referenceData) // Inverse side
  referenceDrug?: ReferenceDrug;

  static async getAnyOfType(referenceDataType: ReferenceDataType): Promise<ReferenceData | null> {
    const repo = this.getRepository();

    return repo.findOne({
      where: {
        type: referenceDataType,
        visibilityStatus: VisibilityStatus.Current,
      },
    });
  }

  // ----------------------------------
  // Reference data hierarchy utilities
  // ----------------------------------
  static async getParentRecursive(
    id: string,
    ancestors: ReferenceData[],
    relationType: ReferenceDataRelationType,
  ) {
    const parent = await ReferenceData.getNode({ id }, relationType);
    const parentId = parent?.getParentId();
    if (!parentId) {
      return [parent, ...ancestors];
    }
    return ReferenceData.getParentRecursive(parentId, [parent, ...ancestors], relationType);
  }

  getParentId() {
    return this.parents[0]?.referenceDataParentId;
  }

  static async getNode(
    where: {
      [key: string]: any;
    },
    relationType = ReferenceDataRelationType.AddressHierarchy,
  ) {
    const repo = this.getRepository();

    let recordWithParents = await repo.findOne({
      where: qb => {
        qb.leftJoinAndSelect('ReferenceData.parents', 'parents')
          .where('parents_type = :relationType', {
            relationType,
          })
          .andWhere({ visibilityStatus: VisibilityStatus.Current })
          .andWhere(where);
      },
    });

    if (!recordWithParents) {
      // It's not possible to do right or outer joins in type orm so we have to do a second query
      // the other option would be to write the query in raw sql but then it wouldn't be possible
      // to use an object for the where parameter
      recordWithParents = await repo.findOne({
        where: qb => {
          qb.leftJoinAndSelect('ReferenceData.parents', 'parents')
            .where({ visibilityStatus: VisibilityStatus.Current })
            .andWhere(where);
        },
      });
    }

    return recordWithParents;
  }

  async getAncestors(relationType = ReferenceDataRelationType.AddressHierarchy) {
    const leafNode = await ReferenceData.getNode({ id: this.id }, relationType);
    const parentId = leafNode.parents[0]?.referenceDataParentId;

    if (!parentId) {
      return [];
    }
    return ReferenceData.getParentRecursive(parentId, [], relationType);
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
}

export const ReferenceDataRelation = (): any =>
  ManyToOne(() => ReferenceData, undefined, { eager: true });

export const NullableReferenceDataRelation = (): any =>
  ManyToOne(() => ReferenceData, undefined, { eager: true, nullable: true });
