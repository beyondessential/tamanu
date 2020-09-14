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

}
