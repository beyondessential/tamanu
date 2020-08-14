import { BaseEntity as TypeORMBaseEntity, PrimaryColumn, Generated } from 'typeorm/browser';

export abstract class BaseEntity extends TypeORMBaseEntity {

  @PrimaryColumn()
  @Generated("uuid")
  id: string;

}
