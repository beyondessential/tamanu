const config = require('config');
const basicAuth = require('basic-auth');
const { Ability } = require('@casl/ability');
const { permittedFieldsOf } = require('@casl/ability/extra');
const { set, find } = require('lodash');
const BaseAuth = require('../../../shared/services/auth');
const database = require('./database');
const { HTTP_METHOD_TO_ACTION } = require('../constants');
const { schemas } = require('../../../shared/schemas');

class Auth extends BaseAuth {
  constructor(props) {
    super(props);
    this.database = database;
    this.user = null;
    this.client = '';
    this.sessionTimeout = config.sessionTimeout
                            ? config.sessionTimeout
                            : (60 * 60 * 5 * 1000);
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

  validatePermissions() {
    return (req, res, next) => {
      const { params, method, user, client, body } = req;
      const { model } = params;
      const _reject = (error = 'Invalid request', code = 405) => res.status(code).send(error);

      // Get schema
      const schema = find(schemas, ({ name }) => name === model);
      if (!schema) return _reject();

      try {
        const action = HTTP_METHOD_TO_ACTION[method];
        if (!user || !client || !model || !action) return _reject();

        this.user = user;
        this.client = client;
        const allowed = this._isAllowed({ action, model, schema, body });
        if (allowed === false) return _reject();

        next();
      } catch (error) {
        return _reject(error.toString());
      }
    }
  }

  _isAllowed({ action, model, schema, body }) {
    try {
      const abilities = this._getAbilities();
      if (abilities === false) return false;

      const ability = new Ability(abilities);
      const canDo = ability.can(action, model);
      if (!canDo) return false;

      const allFields = Object.keys(schema.properties)
      const allowedFields = permittedFieldsOf(ability, action, model, {
        fieldsFrom: rule => rule.fields || allFields
      });

      const bodyKeys = Object.keys(body);
      const keysFiltered = bodyKeys.filter(_key => allowedFields.includes(_key));
      console.log({ keysFiltered, bodyKeys });
      if (keysFiltered.length !== bodyKeys.length) return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  _getAbilities() {
    try {
      const { roles }  = this.user;
      const { hospitalId } = this.client;
      const userRole = roles.find(({ hospital }) => hospital._id === hospitalId);
      if (!userRole) return false;

      const { role } = userRole;
      let { abilities } = role;
      if (abilities) abilities = JSON.parse(abilities);
      return abilities;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

module.exports = Auth;
