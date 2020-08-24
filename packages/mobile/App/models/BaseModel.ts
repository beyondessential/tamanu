import { BaseEntity, PrimaryColumn, Generated } from 'typeorm/browser';

export abstract class BaseModel extends BaseEntity {

  @PrimaryColumn()
  @Generated("uuid")
  id: string;

  static async create(data) {
    const record = new this();
    Object.assign(record, data);
    await record.save();
    return record;
  }

}
