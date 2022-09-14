// Sequelize needs to be imported here to be properly extended
import sequelize, { AbstractDataTypeConstructor } from 'sequelize';

// Extend Sequelize DataTypes with our own custom types.
declare module 'sequelize' {
  export interface DataTypes {
    DATESTRING: AbstractDataTypeConstructor;
    DATETIMESTRING: AbstractDataTypeConstructor;
    PERIOD: AbstractDataTypeConstructor;
    IDENTIFIER: AbstractDataTypeConstructor;
  }
}
