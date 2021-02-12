import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  BeforeUpdate,
  Index,
  MoreThan,
  FindOptionsUtils,
} from 'typeorm/browser';

export type FindMarkedForUploadOptions = {
  channel: string,
  limit?: number,
  after?: string,
};

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ default: true })
  markedForUpload: boolean;

  @Column({ nullable: true })
  uploadedAt: Date;

  @BeforeUpdate()
  markForUpload() {
    // TODO: go through and make sure records always use save(), not update()
    this.markedForUpload = true;
  }

  async markParentForUpload(parentModel: typeof BaseModel, property: string) {
    let entity: BaseModel;
    if (typeof this[property] === 'string') {
      entity = await parentModel.findOne({ where: { id: this[property] } })
    } else {
      const thisModel = this.constructor as typeof BaseModel;
      entity = await thisModel
        .getRepository()
        .createQueryBuilder()
        .relation(thisModel, property)
        .of(this)
        .loadOne();
    }
    entity.markedForUpload = true;
    await entity.save();
  }

  static async markUploaded(ids: string | string[], uploadedAt: Date): Promise<void> {
    await this.getRepository().update(ids, { uploadedAt, markedForUpload: false });
  }

  static createAndSaveOne<T extends BaseModel>(data?: object): Promise<T> {
    return this.getRepository<T>().create(data).save();
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    // query is built separately so it can be modified in child classes
    return this.findMarkedForUploadQuery(opts).getMany();
  }

  static findMarkedForUploadQuery(
    { limit, after }: FindMarkedForUploadOptions,
  ) {
    const whereAfter = (typeof after === 'string') ? { id: MoreThan(after) } : {};

    const qb = this.getRepository().createQueryBuilder();
    return FindOptionsUtils.applyOptionsToQueryBuilder(qb, {
      where: {
        markedForUpload: true,
        ...whereAfter,
      },
      order: {
        id: 'ASC',
      },
      take: limit,
      relations: this.includedSyncRelations,
    });
  }

  static shouldExport = false;

  // Exclude these properties from uploaded model
  // May be columns or relationIds
  static excludedSyncColumns: string[] = [
    'createdAt',
    'updatedAt',
    'markedForUpload',
    'uploadedAt',
  ];

  // Include these relations on uploaded model
  // Does not currently handle lazy or embedded relations
  static includedSyncRelations: string[] = [];
}
