// Sequelize needs to be imported here to be properly extended
import sequelize, { 
  type Sequelize, 
  type ModelAttributeColumnOptions, 
  type Model, 
  type DataType, 
  type ModelAttributes as BaseModelAttributes 
} from 'sequelize';

// Extend Sequelize DataTypes with our own custom types.
declare module 'sequelize' {
  namespace DataTypes {
    export const DATETIMESTRING: AbstractDataTypeConstructor;
    export const DATESTRING: AbstractDataTypeConstructor;
  }
  export interface Sequelize extends sequelize.Sequelize {
    isInsideTransaction(): boolean;
  }

  export interface DestroyOptions extends sequelize.DestroyOptions {
    model?: typeof sequelize.Model<{ id: string | number }>;
  }
}

export interface SessionConfig {
  syncAllLabRequests?: boolean
}

export type ModelAttributes = BaseModelAttributes & {
  sequelize: Sequelize;
  primaryKey: ModelAttributeColumnOptions<Model<any, any>> | DataType;
};
