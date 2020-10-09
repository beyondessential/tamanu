import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  getRepository,
} from 'typeorm/browser';

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static getRepository(): any {
    return getRepository(this);
  }

  static async create<T extends BaseModel>(data: any): Promise<T> {
    const repo = this.getRepository();
    const record = repo.create({
      ...data,
    });
    await record.save();
    return record;
  }

  static async update(data: any): Promise<void> {
    const repo = this.getRepository();
    return repo.update(data.id, data);
  }

  static async createOrUpdate(data: any): Promise<void> {
    const repo = this.getRepository();
    const existing = await repo.count({ id: data.id });
    if(existing > 0) {
      return this.update(data);
    }
    return this.create(data);
  }

}
