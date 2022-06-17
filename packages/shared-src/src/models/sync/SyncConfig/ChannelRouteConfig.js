import { pick } from 'lodash';
import * as yup from 'yup';

import { ParamConfig, paramConfigSchema } from './ParamConfig';
import { isTruthy, func } from './schemaUtils';

export const channelRouteConfigSchema = yup.object({
  // route, e.g. `patient/:patientId/issue`
  route: yup.string().required(),
  // function to convert params to an object with a sequelize `where` and optional `include`
  // e.g. { where: { foo: '1' }, include: [{ ... }] }
  queryFromParams: func().required(),
  // list of parameters a channel can have
  params: yup.array(paramConfigSchema).test(isTruthy),
});

export class ChannelRouteConfig {
  route;

  queryFromParams;

  params;

  constructor(model, options = {}) {
    const {
      route,
      params = [],
      queryFromParams = paramsObject => ({
        where: pick(
          paramsObject,
          this.params.map(p => p.name),
        ),
      }),
    } = options;

    this.route = route;
    this.queryFromParams = queryFromParams;

    // merge param config
    this.params = params.map(paramConfigOptions => new ParamConfig(model, paramConfigOptions));
  }

  validateRecordParams(record, paramsObject) {
    for (const paramConfig of this.params) {
      paramConfig.validateParam(record, paramsObject);
    }
  }
}
