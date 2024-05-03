import { Column, Entity, ManyToOne, OneToMany, Like } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferenceData, ReferenceDataType } from '~/types';
import { VisibilityStatus } from '../visibilityStatuses';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceDataRelation as RefDataRelation } from './ReferenceDataRelation';
import { REFERENCE_DATA_RELATION_TYPES } from '/components/HierarchyFields';

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
    () => RefDataRelation,
    entity => entity.referenceDataParent,
  )
  public children: RefDataRelation[];
  @OneToMany(
    () => RefDataRelation,
    entity => entity.referenceData,
  )
  public parents: RefDataRelation[];

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
  static async getParentRecursive(id, ancestors, relationType) {
    const parent = await ReferenceData.getNode({ id }, relationType);
    const parentId = parent.getParentId();
    if (!parentId || ancestors.length > 5) {
      return [...ancestors, parent];
    }
    return ReferenceData.getParentRecursive(parentId, [...ancestors, parent], relationType);
  }

  getParentId() {
    return this.parents[0]?.referenceDataParentId;
  }

  static async getNode(where, relationType = REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY) {
    const repo = this.getRepository();

    const recordWithParents = await repo.findOne(
      { visibilityStatus: VisibilityStatus.Current, ...where },
      {
        relations: ['parents'],
      },
    );

    return recordWithParents;
  }

  async getAncestors(relationType = REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY) {
    const baseNode = await ReferenceData.getNode({ id: this.id }, relationType);
    const parentId = baseNode.parents[0].referenceDataParentId;

    if (!parentId) {
      return [];
    }
    return ReferenceData.getParentRecursive(parentId, [baseNode], relationType);
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
