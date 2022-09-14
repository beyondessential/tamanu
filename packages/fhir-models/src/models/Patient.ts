import { Table, Column, DataType } from 'sequelize-typescript';
import { dateType } from 'shared/models/dateTimeTypes';
import { FhirResource } from './Resource';

@Table
export class FhirPatient extends FhirResource {
  @Column({ type: DataType.ARRAY(DataType.JSONB), defaultValue: [] })
  declare identifier: object[];

  @Column({ defaultValue: false })
  declare active: boolean;

  @Column({ type: DataType.ARRAY(DataType.JSONB), defaultValue: [] })
  declare name: object[];

  @Column({ type: DataType.ARRAY(DataType.JSONB), defaultValue: [] })
  declare telecom: object[];

  @Column({ type: DataType.STRING(10) })
  declare gender: string;

  @Column({ type: dateType('birthDate'), allowNull: true })
  declare birthDate: string;

  @Column({ type: dateType('deceasedDateTime'), allowNull: true })
  declare deceasedDateTime: string;

  @Column({ type: DataType.ARRAY(DataType.JSONB), defaultValue: [] })
  declare address: object[];
}
