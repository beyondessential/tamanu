import { 
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  getRepository,
} from 'typeorm/browser';

export abstract class BaseModel extends BaseEntity {

  @PrimaryColumn()
  @Generated("uuid")
  id: string;

  @UpdateDateColumn()
  lastModified: string;

  static getRepository() {
    return getRepository(this);
  }

  static async create(data) {
    const repo = this.getRepository();
    const record = repo.create({
      ...data
    });
    await record.save();
    return record;
  }

  static async update(data) {
    const repo = this.getRepository();
    return repo.update(data.id, data);
  }

  static async createOrUpdate(data) {
    const repo = this.getRepository();
    const existing = await repo.findOne(data.id);
    if(existing) {
      return this.update(data);
    }
    return this.create(data);
  }

}
