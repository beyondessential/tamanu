import { hash } from 'bcrypt';
import config from 'config';
import { Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS, SYSTEM_USER_UUID, VISIBILITY_STATUSES } from '@tamanu/constants';

import { Model } from './Model';
import { Permission } from './Permission';
import { getAbilityForUser } from '../permissions/rolesToPermissions';
import { ForbiddenError } from '../errors';
import { getSubjectName } from '../permissions/middleware';

const DEFAULT_SALT_ROUNDS = 10;

export class User extends Model {
  static SALT_ROUNDS = DEFAULT_SALT_ROUNDS;

  static hashPassword(pw) {
    return hash(pw, User.SALT_ROUNDS ?? DEFAULT_SALT_ROUNDS);
  }

  static getSystemUser() {
    return this.findByPk(SYSTEM_USER_UUID);
  }

  forResponse() {
    const values = Object.assign({}, this.dataValues);
    delete values.password;
    return values;
  }

  async setPassword(pw) {
    this.password = await User.hashPassword(pw);
  }

  static async sanitizeForInsert(values) {
    const { password, ...otherValues } = values;
    if (!password) return values;

    return { ...otherValues, password: await User.hashPassword(password) };
  }

  static async update(values, ...args) {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.update(sanitizedValues, ...args);
  }

  static async create(values, ...args) {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.create(sanitizedValues, ...args);
  }

  static async bulkCreate(records, ...args) {
    const sanitizedRecords = await Promise.all(records.map(r => this.sanitizeForInsert(r)));
    return super.bulkCreate(sanitizedRecords, ...args);
  }

  static async upsert(values, ...args) {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.upsert(sanitizedValues, ...args);
  }

  static async getForAuthByEmail(email) {
    const user = await this.scope('withPassword').findOne({
      where: {
        // email addresses are case insensitive so compare them as such
        email: Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('email')),
          Sequelize.fn('lower', email),
        ),
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: Sequelize.STRING,
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        password: Sequelize.STRING,
        displayName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        role: {
          type: Sequelize.STRING,
          defaultValue: 'practitioner',
          allowNull: false,
        },
        phoneNumber: {
          type: Sequelize.STRING,
        },
        visibilityStatus: {
          type: Sequelize.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        defaultScope: {
          attributes: { exclude: ['password'] },
        },
        scopes: {
          withPassword: {
            attributes: { include: ['password'] },
          },
        },
        indexes: [{ fields: ['email'] }],
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        hooks: {
          async beforeUpdate(user) {
            if (user.changed('password')) {
              // eslint-disable-next-line require-atomic-updates
              user.password = await User.hashPassword(user.password);
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Discharge, {
      foreignKey: 'dischargerId',
      as: 'discharges',
    });

    this.hasMany(models.ImagingRequest, {
      foreignKey: 'completedById',
    });

    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'clinicianId',
    });

    this.hasMany(models.PatientProgramRegistrationCondition, {
      foreignKey: 'clinicianId',
    });

    this.hasMany(models.PatientProgramRegistrationCondition, {
      foreignKey: 'deletionClinicianId',
    });

    this.hasMany(models.UserPreference, {
      foreignKey: 'userId',
    });

    this.belongsToMany(models.Facility, {
      through: 'UserFacility',
      as: 'facilities',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  isSuperUser() {
    return this.role === 'admin' || this.id === SYSTEM_USER_UUID;
  }

  async checkPermission(action, subject, field = '') {
    const ability = await getAbilityForUser({ Permission }, this);
    const subjectName = getSubjectName(subject);
    const hasPermission = ability.can(action, subject, field);

    if (!hasPermission) {
      const rule = ability.relevantRuleFor(action, subject, field);
      const reason =
        (rule && rule.reason) || `Cannot perform action "${action}" on ${subjectName}.`;

      throw new ForbiddenError(reason);
    }
  }

  async hasPermission(action, subject, field = '') {
    try {
      await this.checkPermission(action, subject, field);
      return true;
    } catch (e) {
      return false;
    }
  }

  async checkCanAccessAllFacilities() {
    if (!config.auth.restrictUsersToFacilities) return true;
    if (this.isSuperUser()) return true;
    // Allow for roles that have access to all facilities configured via permissions
    // (e.g. a custom "AdminICT" role)
    if (await this.hasPermission('login', 'Facility')) return true;
    return false;
  }

  async allowedFacilities() {
    const extractIdAndName = ({ id, name }) => ({ id, name });

    const canAccessAllFacilities = await this.checkCanAccessAllFacilities();
    if (canAccessAllFacilities) {
      const facilities = await this.sequelize.models.Facility.findAll();
      return facilities.map(extractIdAndName);
    }

    if (!this.facilities) {
      await this.reload({ include: 'facilities' });
    }

    return this.facilities?.map(extractIdAndName) ?? [];
  }

  async allowedFacilityIds() {
    const allowedFacilities = await this.allowedFacilities();
    return allowedFacilities.map(f => f.id);
  }

  async canAccessFacility(id) {
    const allowed = await this.allowedFacilityIds();
    return allowed?.includes(id) ?? false;
  }
}
