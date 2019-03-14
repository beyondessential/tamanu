const config = require('config');
const basicAuth = require('basic-auth');
const { set, isEmpty } = require('lodash');
const BaseAuth = require('../../../shared/services/auth');
const { schemaClasses } = require('../../../shared/schemas');
const database = require('./database');
const { HTTP_METHOD_TO_ACTION } = require('../constants');

class Auth extends BaseAuth {
  constructor(props) {
    super(props);
    this.database = database;
    this.user = null;
    this.client = '';
    this.sessionTimeout = (60 * 60 * 120 * 1000);; // config.sessionTimeout
                            // ? config.sessionTimeout
                            // : (60 * 60 * 5 * 1000);
    // TODO: add keep-alive functionality
  }

  async login(props) {
    const hospitalId = this.database.getSetting('HOSPITAL_ID');
    const newProps = {
      ...props,
      firstTimeLogin: false,
      hospital: hospitalId,
    };
    return super.login(newProps);
  }

  authorizeRequest() {
    return async (req, res, next) => {
      const _reject = (error = 'Invalid credentials', code = 401) => res.status(code).send(error);

      try {
        const credentials = basicAuth(req);
        if (!credentials) return _reject();

        const { name: clientId, pass: clientSecret } = credentials;
        const client = await this.verifyExtendToken({ clientId, clientSecret });

        // console.log('-client-', client);
        if (client && client.userId) {
          const { userId } = client;
          const user = database.findOne('user', userId);
          if (user) {
            set(req, 'user', user);
            set(req, 'client', client);
            return next(null, user);
          }
        }

        return _reject();
      } catch (error) {
        return _reject(error.toString());
      }
    }
  }

  validateRequestPermissions() {
    return (req, res, next) => {
      let subject;
      const { params, method, user, client, body } = req;
      const { model, id } = params;
      const { hospitalId } = client;
      const fields = Object.keys(body);
      const _reject = (error = 'Invalid permissions', code = 405) => res.status(code).send(error);

      switch (true) {
        case (method === 'GET' && !isEmpty(id)):
          Object.defineProperty(schemaClasses[model], 'name', { value: model })
          subject = new schemaClasses[model]({ _id: id });
        break;
        case (['PUT','PATCH','POST'].includes(method) && !isEmpty(id)):
          Object.defineProperty(schemaClasses[model], 'name', { value: model })
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
          hospitalId,
          action,
          subject,
          fields
        });

        if (permissionsValid === true) return next();
        return _reject(permissionsValid || 'Not enough permissions!');
      } catch (error) {
        return _reject(error.toString());
      }
    }
  }
}

module.exports = Auth;
