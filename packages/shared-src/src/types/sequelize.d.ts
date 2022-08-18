import sequelize from 'sequelize'

// Extend Sequelize DataTypes with our own custom types.
declare module "sequelize" {
    namespace DataTypes {
        export const DATETIMESTRING: AbstractDataType
        export const DATESTRING: AbstractDataType
    }
}