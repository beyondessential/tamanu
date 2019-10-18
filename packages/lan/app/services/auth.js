import basicAuth from 'basic-auth';
import { set, isEmpty } from 'lodash';
import BaseAuth from 'Shared/services/auth';
import { schemaClasses } from 'Shared/schemas';
import { HTTP_METHOD_TO_ACTION } from '../constants';

export default class Auth extends BaseAuth {
  constructor(props) {
    super(props);
    this.user = null;
    this.client = '';
    this.sessionTimeout = 60 * 60 * 120 * 1000; // config.sessionTimeout
    // ? config.sessionTimeout
    // : (60 * 60 * 5 * 1000);
    // TODO: add keep-alive functionality
  }

  async login(props) {
    const facilityId = this.database.getSetting('FACILITY_ID');
    const newProps = {
      ...props,
      firstTimeLogin: false,
      facility: facilityId,
    };
    return super.login(newProps);
  }

  async authorizeRequest(req, res, next) {
    const reject = (error = 'Invalid credentials', code = 401) => res.status(code).send(error);

    try {
      const credentials = basicAuth(req);
      if (!credentials) return reject();

      const { name: clientId, pass: clientSecret } = credentials;
      const client = await this.verifyExtendToken({ clientId, clientSecret });
      if (client && client.userId) {
        const { userId } = client;
        const user = this.database.findOne('user', userId);
        if (user) {
          set(req, 'user', user);
          set(req, 'client', client);
          return next(null, user);
        }
      }

      return reject();
    } catch (error) {
      return reject(error.toString());
    }
  }

  validateRequestPermissions(req, res, next) {
    let subject;
    const { params, method, user, client, body } = req;
    const { model, id } = params;
    const { facilityId } = client;
    const fields = Object.keys(body);
    const reject = (error = 'Invalid permissions', code = 405) => res.status(code).send(error);

    switch (true) {
      case method === 'GET' && !isEmpty(id):
        Object.defineProperty(schemaClasses[model], 'name', { value: model });
        subject = new schemaClasses[model]({ _id: id });
        break;
      case ['PUT', 'PATCH', 'POST'].includes(method) && !isEmpty(id):
        Object.defineProperty(schemaClasses[model], 'name', { value: model });
        subject = new schemaClasses[model]({ _id: id, ...body });
        break;
      default:
        subject = model;
        break;
    }

    try {
      const action = HTTP_METHOD_TO_ACTION[method];
      const permissionsValid = this.validatePermissions({
        user,
        facilityId,
        action,
        subject,
        fields,
      });

      if (permissionsValid === true) return next();
      return reject(permissionsValid || 'Not enough permissions!');
    } catch (error) {
      return reject(error.toString());
    }
  }
}
