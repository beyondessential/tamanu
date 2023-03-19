// Sequelize needs to be imported here to be properly extended
import sequelize from 'sequelize';

// Extend Sequelize DataTypes with our own custom types.
declare module 'sequelize' {
  namespace DataTypes {
    export const DATETIMESTRING: AbstractDataTypeConstructor;
    export const DATESTRING: AbstractDataTypeConstructor;
  }
}
