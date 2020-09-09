import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  getRepository,
} from 'typeorm/browser';

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  static getRepository(): any {
    return getRepository(this);
  }

  static async create(data): Promise<BaseEntity> {
    const repo = this.getRepository();
    const record = repo.create({
      ...data,
    });
    await record.save();
    return record;
  }
}
