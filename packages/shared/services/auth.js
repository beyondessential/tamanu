const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { to } = require('await-to-js');
const jwt = require('jsonwebtoken');
const { Ability } = require('@casl/ability');
const { permittedFieldsOf } = require('@casl/ability/extra');
const {
  isEmpty, isArray, head, isNumber,
  find, difference, template
} = require('lodash');
const { objectToJSON } = require('../utils');
const { schemas, schemaClasses } = require('../../shared/schemas');

class BaseAuth {
  constructor(database) {
    this.saltRounds = 12;
    this.database = database;
    this.secret = 'nkefnpIIfnepnPIFBpibFIBbepE';
    this.issuer = 'realm-sync';
    this.errors = {
      InvalidCredentials: 'Invalid email or password entered.',
      InvalidHospital: 'User not linked to aany facility.',
      invalidToken: 'Invalid credentials.'
    };
  }

  async login({
    email,
    password: passwordEntered,
    hospital: hospitalSelected,
    clientId,
    firstTimeLogin = false
  }) {
    if (!isNumber(this.sessionTimeout)) throw new Error('Invalid session timeout.');
    const expiry = new Date().getTime() + this.sessionTimeout;

    const { _id: userId, password, hospitals } = this._userExists({ email });
    if (!userId)  return Promise.reject(new Error(this.errors.InvalidCredentials));

    // Check user's password
    const [err, validPassword] = await to(bcrypt.compare(passwordEntered, password));
    if (err) console.error(err);
    if (!validPassword || err) return Promise.reject(new Error(this.errors.InvalidCredentials));

    // Validate hospital
    const checkHospitalResponse = this._checkHospital({ hospitals, hospitalSelected, firstTimeLogin });
    if (checkHospitalResponse === false)  return Promise.reject(new Error(this.errors.InvalidHospital));
    if (isArray(checkHospitalResponse)) {
      return {
        action: 'select-hospital',
        options: checkHospitalResponse
      };
    }

    const { _id: hospitalId } = checkHospitalResponse;
    if (!hospitalId) return Promise.reject(new Error(this.errors.InvalidHospital));

    // Register the client
    const clientSecret = this.generateJWTToken({ hospitalId, userId });
    return this._addClient({ hospitalId, userId, clientId, clientSecret, expiry });
  }

  _userExists({ email }) {
    let user = this.database.findOne('user', email, 'email');
    if (user && user !== null) {
      try {
        user = objectToJSON(user);
        return user;
      } catch (err) {
        throw err;
      }
    }
    return false;
  }

  _checkHospital({ hospitals, hospitalSelected, firstTimeLogin }) {
    if (isEmpty(hospitals)) throw this.errors.InvalidHospital;
    if (hospitals.length > 1 && !hospitalSelected) {
      return hospitals.map(({ _id, name }) => ({ _id, name }));
    }

    if (hospitalSelected) {
      const hospital = hospitals.find(({ _id }) => (_id === hospitalSelected));
      if (hospital) return hospital;
    }

    if (firstTimeLogin && hospitals.length > 0) return head(hospitals);
    return false;
  }

  _addClient({ hospitalId, userId, clientId, clientSecret, expiry }) {
    let client;
    this.database.write(() => {
      client = this.database.create('client', {
        hospitalId,
        userId,
        clientId,
        clientSecret,
        expiry,
        date: new Date()
      }, true);
    });
    return client;
  }

  async verifyExtendToken({ clientId, clientSecret, extend=true }) {
    try {
      const user = this.database.find(
        'client',
        `clientId = "${clientId}" AND clientSecret = "${clientSecret}" AND expiry > "${new Date().getTime()}" `
      );
      if (user && user.length > 0) {
        if (extend === true && isNumber(this.sessionTimeout)) {
          this.database.write(() => user.sessionTimeout = new Date().getTime() + this.sessionTimeout);
        }
        return head(user);
      }
      return Promise.reject(new Error(this.errors.invalidToken));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  generateJWTToken({ userId, hospitalId, ...opts }) {
    if (!this.secret) throw new Error('JWT secret not set');
    const payload = { userId, hospitalId };
    return jwt.sign(payload, this.secret, {
      expiresIn: "2w",
      issuer: this.issuer,
      ...opts
    });
  }

  /**
   * Verify JWT token using shared secret key between LAN and the Server
   * @param {String} token The JWT token
   */
  verifyJWTToken(token) {
    if (!this.secret) throw new Error('JWT secret not set');
    try {
      token = Buffer.from(token, 'base64').toString();
      const valid = jwt.verify(token, this.secret, { issuer: this.issuer });
      return valid;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Validate user permissions
   * @param {user, hospitalId, action, subject, fields} param
   */
  validatePermissions({ user, hospitalId, action, subject, fields }) {
    // console.log('-validatePermissions', { user, hospitalId, action, subject, fields });
    if (!user || !hospitalId || !action || !subject) return false;
    if (typeof user === 'string') user = this.database.findOne('user', user);
    this.user = user; // Set user

    // Get schema
    const schema = find(schemas, ({ name }) => (name === subject || subject instanceof schemaClasses[name]));
    if (!schema) {
      return `schema rejected ${subject}`;
    }

    try {
      const abilities = this.getAbilities({ userId: user._id, hospitalId }); // Get abilities
      if (abilities === false) {
        console.error('validatePermissionsError', abilities);
        return false;
      }

      const ability = new Ability(abilities);
      const canDo = ability.can(action, subject);
      if (!canDo) {
        console.error('validatePermissionsError', abilities, canDo);
        return false;
      }

      const allFields = Object.keys(schema.properties);
      const allowedFields = permittedFieldsOf(ability, action, subject, {
        fieldsFrom: rule => rule.fields || allFields
      });

      const unAuthFields = difference(fields, allowedFields);
      if (!isEmpty(unAuthFields) && schema.name !== 'modifiedField') {
        return `fields rejected ${unAuthFields}`;
      }

      return true;
    } catch (error) {
      return error;
    }
  }

  getAbilities({ hospitalId, userId, ...props }) {
    try {
      let { user } = this;
      if (!user && userId) {
        user = this.database.findOne('user', userId);
      }
      if (!user) return false;
      const { roles }  = user;
      const userRole = roles.find(({ hospital }) => hospital._id === hospitalId);
      if (!userRole) return false;

      const { role } = userRole;
      let { abilities } = role;
      abilities = template(abilities)({ hospitalId, ...props });
      if (abilities) abilities = JSON.parse(abilities);
      return abilities;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

module.exports = BaseAuth;
