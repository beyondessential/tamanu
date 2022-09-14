import { Sequelize } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ schema: 'fhir' })
export class FhirResource extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  })
  declare versionId: string;

  @Column({ defaultValue: Sequelize.fn('current_timestamp', 3) })
  declare lastUpdated: Date;
}
