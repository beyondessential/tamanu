import sequelize from 'sequelize'

declare module "sequelize" {
    namespace DataTypes {
        export const DATETIMESTRING: AbstractDataType
        export const DATESTRING: AbstractDataType
    }
}