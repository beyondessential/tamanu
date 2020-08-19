import { BaseEntity, PrimaryColumn, Generated } from 'typeorm/browser';

export abstract class BaseModel extends BaseEntity {

  @PrimaryColumn()
  @Generated("uuid")
  id: string;

}
