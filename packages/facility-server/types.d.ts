declare namespace Express {
  export interface Request {
    models?: import('./app/ApplicationContext').ApplicationContext['models'];
    db?: import('./app/ApplicationContext').ApplicationContext['sequelize'];
    settings?: import('@tamanu/settings').ReadSettings<
      import('@tamanu/settings/types').FacilitySettingPath
    >;
  }
}
