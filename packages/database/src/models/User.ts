import { createSecretKey, randomBytes } from 'node:crypto';
import { compare, hash } from 'bcrypt';
import * as jose from 'jose';
import { unionBy } from 'lodash';
import { DataTypes, Sequelize } from 'sequelize';
import type { Logger } from 'winston';
import * as z from 'zod';
import type { Subject } from '@casl/ability';
import {
  CAN_ACCESS_ALL_FACILITIES,
  DEVICE_SCOPES,
  JWT_KEY_ALG,
  JWT_KEY_ID,
  JWT_TOKEN_TYPES,
  LOCKED_OUT_ERROR_MESSAGE,
  LOGIN_ATTEMPT_OUTCOMES,
  SERVER_TYPES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import {
  AuthPermissionError,
  ForbiddenError,
  InvalidCredentialError,
  InvalidTokenError,
  MissingCredentialError,
  RateLimitedError,
} from '@tamanu/errors';
import type { ReadSettings } from '@tamanu/settings';
import { getAbilityForUser } from '@tamanu/shared/permissions/rolesToPermissions';
import { getSubjectName } from '@tamanu/shared/permissions/middleware';

import { Model } from './Model';
import type { Facility } from './Facility';
import type { Device } from './Device';
import type { InitOptions, ModelProperties, Models } from '../types/model';
import { isBcryptHash } from '@tamanu/utils/password';

const DEFAULT_SALT_ROUNDS = 10;

export class User extends Model {
  declare id: string;
  declare displayId?: string;
  declare email: string;
  declare password?: string;
  declare displayName: string;
  declare role: string;
  declare phoneNumber?: string;
  declare visibilityStatus: string;
  declare facilities: Facility[];

  static SALT_ROUNDS = DEFAULT_SALT_ROUNDS;

  static hashPassword(pw: string) {
    return hash(pw, User.SALT_ROUNDS ?? DEFAULT_SALT_ROUNDS);
  }

  static isPasswordHashed(password: string): boolean {
    return isBcryptHash(password);
  }

  static getSystemUser() {
    return this.findByPk(SYSTEM_USER_UUID);
  }

  forResponse() {
    const values = Object.assign({}, this.dataValues);
    delete values.password;
    return values;
  }

  async setPassword(pw: string) {
    this.password = await User.hashPassword(pw);
  }

  static async sanitizeForInsert(values: any) {
    const { password, ...otherValues } = values;
    if (!password) return values;

    // Only hash if the password is not already hashed (to avoid rehashing when syncing)
    const hashedPassword = User.isPasswordHashed(password)
      ? password
      : await User.hashPassword(password);

    return { ...otherValues, password: hashedPassword };
  }

  static async update(values: any, options: any): Promise<any> {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.update(sanitizedValues, options);
  }

  static async create(values: any, ...args: any[]): Promise<any> {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.create(sanitizedValues, ...args);
  }

  static async bulkCreate(records: any[], ...args: any[]): Promise<any> {
    const sanitizedRecords = await Promise.all(records.map(r => this.sanitizeForInsert(r)));
    return super.bulkCreate(sanitizedRecords, ...args);
  }

  static async upsert(values: any, ...args: any[]): Promise<any> {
    const sanitizedValues = await this.sanitizeForInsert(values);
    return super.upsert(sanitizedValues, ...args);
  }

  static async getForAuthByEmail(email: string) {
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

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        displayId: DataTypes.STRING,
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: DataTypes.STRING,
        displayName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING,
          defaultValue: 'practitioner',
          allowNull: false,
        },
        phoneNumber: {
          type: DataTypes.STRING,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
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
          async beforeUpdate(user: User) {
            if (user.changed('password')) {
              // Only hash if the password is not already hashed (to avoid rehashing when syncing)
              if (!User.isPasswordHashed(user.password!)) {
                // eslint-disable-next-line require-atomic-updates
                user.password = await User.hashPassword(user.password!);
              }
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
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

    (this.belongsToMany as any)(models.Facility, {
      through: 'UserFacility',
      as: 'facilities',
      where: {
        deletedAt: null,
      },
    });

    this.hasMany(models.UserDesignation, {
      foreignKey: 'userId',
      as: 'designations',
    });

    this.belongsToMany(models.ReferenceData, {
      through: models.UserDesignation,
      foreignKey: 'userId',
      as: 'designationData',
    });

    this.hasMany(models.UserLeave, {
      foreignKey: 'userId',
      as: 'leaves',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      {
        model: models.UserDesignation,
        as: 'designations',
        include: {
          model: models.ReferenceData,
          as: 'referenceData',
        },
      },
      {
        model: models.Facility,
        as: 'facilities',
        attributes: ['id'],
      },
    ];
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  isSuperUser() {
    return this.role === 'admin' || this.id === SYSTEM_USER_UUID;
  }

  async checkPermission(action: string, subject: Subject, field = '') {
    const { Permission } = this.sequelize.models;
    const ability = await getAbilityForUser({ Permission }, this);
    const subjectName = getSubjectName(subject);
    const hasPermission = ability.can(action, subject!, field);

    if (!hasPermission) {
      const rule = ability.relevantRuleFor(action, subject!, field);
      const reason =
        (rule && rule.reason) || `Cannot perform action "${action}" on ${subjectName}.`;

      throw new ForbiddenError(reason);
    }
  }

  async hasPermission(action: string, subject: Subject, field = '') {
    try {
      await this.checkPermission(action, subject, field);
      return true;
    } catch (e) {
      return false;
    }
  }

  async canSync(facilityIds: string[], { settings }: { settings: any }) {
    const restrictUsersToSync = await settings.get('auth.restrictUsersToSync');
    if (!restrictUsersToSync) return true;
    if (this.isSuperUser()) return true;

    // Permission to sync any facility
    if (await this.hasPermission('sync', 'Facility')) return true;

    // Permission to sync specific facilities
    for (const facilityId of facilityIds) {
      if (await this.hasPermission('sync', 'Facility', facilityId)) return true;
    }

    return false;
  }

  async allowedFacilities() {
    const { Facility, Setting } = this.sequelize.models;

    if (this.isSuperUser()) return CAN_ACCESS_ALL_FACILITIES;

    const restrictUsersToFacilities = await Setting.get('auth.restrictUsersToFacilities');
    const hasLoginPermission = await this.hasPermission('login', 'Facility');
    const hasAllNonSensitiveFacilityAccess = !restrictUsersToFacilities || hasLoginPermission;

    const sensitiveFacilities = await Facility.count({ where: { isSensitive: true } });
    if (hasAllNonSensitiveFacilityAccess && sensitiveFacilities === 0)
      return CAN_ACCESS_ALL_FACILITIES;

    // Get user's linked facilities
    if (!this.facilities) {
      await this.reload({ include: 'facilities' });
    }
    const explicitlyAllowedFacilities =
      this.facilities?.map(({ id, name }) => ({ id, name })) ?? [];

    if (hasAllNonSensitiveFacilityAccess) {
      // Combine any explicitly linked facilities with all non-sensitive facilities
      const nonSensitiveFacilities = await Facility.findAll({
        where: { isSensitive: false },
        attributes: ['id', 'name'],
        raw: true,
      });

      const combinedFacilities = unionBy(explicitlyAllowedFacilities, nonSensitiveFacilities, 'id');
      return combinedFacilities;
    }

    // Otherwise return only the facilities the user is linked to (including sensitive ones)
    return explicitlyAllowedFacilities;
  }

  async allowedFacilityIds() {
    const allowedFacilities = await this.allowedFacilities();
    if (allowedFacilities === CAN_ACCESS_ALL_FACILITIES) {
      return CAN_ACCESS_ALL_FACILITIES;
    }
    return allowedFacilities.map(f => f.id);
  }

  async canAccessFacility(id: string) {
    const allowedFacilityIds = await this.allowedFacilityIds();
    if (allowedFacilityIds === CAN_ACCESS_ALL_FACILITIES) return true;
    return allowedFacilityIds.includes(id);
  }

  static async filterAllowedFacilities(
    allowedFacilities: string | ModelProperties<Facility>[],
    facilityIds: string[],
  ) {
    if (Array.isArray(allowedFacilities)) {
      return allowedFacilities.filter(f => facilityIds.includes(f.id));
    } else {
      if (allowedFacilities === CAN_ACCESS_ALL_FACILITIES) {
        const facilitiesMatchingIds = await this.sequelize.models.Facility.findAll({
          where: { id: facilityIds },
        });
        return facilitiesMatchingIds?.map(({ id, name }) => ({ id, name })) ?? [];
      }
    }
    return [];
  }

  static readonly LoginPayload = z.object({
    email: z.email(),
    password: z.string().min(1),
    facilityIds: z.array(z.string().min(1)).min(1).optional(),
    deviceId: z.string().optional(),
    scopes: z.array(z.nativeEnum(DEVICE_SCOPES)).optional(),
    clientHeader: z.string().min(1).optional(),
  });

  static async loginFromCredential(
    payload: Record<string, any>,
    { log, settings, tokenSecret, tokenIssuer, tokenDuration }: LoginContext,
  ): Promise<LoginReturn> {
    const { Device, UserLoginAttempt } = this.sequelize.models;
    const {
      email,
      password,
      facilityIds,
      deviceId,
      scopes = [],
      clientHeader,
    } = await this.LoginPayload.parseAsync(payload).catch(error => {
      throw new MissingCredentialError().withCause(error);
    });

    const internalClient = Boolean(
      clientHeader && (Object.values(SERVER_TYPES) as string[]).includes(clientHeader),
    );
    if (internalClient && !deviceId) {
      throw new MissingCredentialError('Missing deviceId');
    }

    const user = await this.getForAuthByEmail(email);
    if (!user && (await settings.get('security.reportNoUserError'))) {
      // an attacker can use this to get a list of user accounts
      // but hiding this error entirely can make debugging a hassle
      // so we just put it behind a flag
      throw new InvalidCredentialError('No such user');
    }

    if (!user) {
      // Keep track of bad requests for non-existent user accounts
      log.info(`Trying to login with non-existent user account: ${email}`);

      // To mitigate timing attacks for discovering user accounts,
      // we perform a fake password comparison that takes a similar amount of time
      await compare(password, '');
      // and return the same error (ish) data as for a true password mismatch
      throw new InvalidCredentialError();
    }
    if (user.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
      throw new AuthPermissionError('User no longer exists');
    }

    // Check if user is locked out
    const { isUserLockedOut, remainingLockout } = await UserLoginAttempt.checkIsUserLockedOut({
      settings,
      userId: user.id,
      deviceId,
    });
    if (isUserLockedOut) {
      log.info(`Trying to login with locked user account: ${email}`);
      throw new RateLimitedError(remainingLockout, LOCKED_OUT_ERROR_MESSAGE);
    }

    const hashedPassword = user?.password || '';
    if (!(await compare(password, hashedPassword))) {
      const { lockoutDuration, remainingAttempts } =
        await UserLoginAttempt.createFailedLoginAttempt({
          settings,
          userId: user.id,
          deviceId,
        });
      if (remainingAttempts === 0) {
        throw new RateLimitedError(lockoutDuration, LOCKED_OUT_ERROR_MESSAGE);
      }
      if (remainingAttempts <= 3) {
        throw new InvalidCredentialError().withExtraData({
          lockoutAttempts: remainingAttempts,
          lockoutDuration,
        });
      }
      throw new InvalidCredentialError();
    }

    // Manage necessary checks for device authorization (check or create accordingly)
    const device = await Device.ensureRegistration({ settings, user, deviceId, scopes });

    // Create successful login attempt
    await UserLoginAttempt.create({
      userId: user.id,
      deviceId,
      outcome: LOGIN_ATTEMPT_OUTCOMES.SUCCEEDED,
    });

    const secret = createSecretKey(new TextEncoder().encode(tokenSecret));
    const token = await new jose.SignJWT({
      userId: user.id,
      deviceId: device?.id,
    })
      .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
      .setJti(randomBytes(32).toString('base64url'))
      .setIssuedAt()
      .setIssuer(tokenIssuer)
      .setAudience(JWT_TOKEN_TYPES.ACCESS)
      .setExpirationTime(tokenDuration)
      .sign(secret);

    return {
      token,
      user,
      device,
      internalClient,
      settings:
        clientHeader &&
        ([SERVER_TYPES.WEBAPP, SERVER_TYPES.FACILITY, SERVER_TYPES.MOBILE] as string[]).includes(clientHeader) &&
        !facilityIds
          ? await settings.getFrontEndSettings()
          : undefined,
    };
  }

  static async loginFromToken(
    token: string,
    { tokenSecret, tokenIssuer }: LoginContext,
  ): Promise<LoginReturn> {
    const { Device, Facility } = this.sequelize.models;

    const secret = createSecretKey(new TextEncoder().encode(tokenSecret));
    const contents = await jose
      .jwtVerify(
        token,
        ({ alg }) => {
          if (alg === 'HS256') {
            return secret;
          }
          throw new InvalidTokenError('Unsupported algorithm');
        },
        {
          issuer: tokenIssuer,
          audience: JWT_TOKEN_TYPES.ACCESS,
          clockTolerance: 10,
        },
      )
      .catch(error => {
        throw new InvalidTokenError().withCause(error);
      });

    const TokenPayload = z.object({
      userId: z.string().min(1),
      deviceId: z.string().min(1).optional(),
      facilityId: z.string().min(1).optional(),
    });

    const { userId, deviceId, facilityId } = await TokenPayload.parseAsync(contents.payload).catch(
      error => {
        throw new InvalidTokenError('Invalid token payload').withCause(error);
      },
    );

    const user = await this.findByPk(userId);
    if (!user) {
      throw new InvalidTokenError('User does not exist').withExtraData({
        userId,
      });
    }
    if (user.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
      throw new AuthPermissionError('User no longer exists');
    }

    const device = deviceId ? ((await Device.findByPk(deviceId)) ?? undefined) : undefined;
    if (deviceId && !device) {
      throw new InvalidTokenError('Device does not exist').withExtraData({
        deviceId,
      });
    }

    const facility = facilityId ? ((await Facility.findByPk(facilityId)) ?? undefined) : undefined;
    if (facilityId && !facility) {
      throw new InvalidTokenError('Facility does not exist').withExtraData({
        facilityId,
      });
    }

    // Get the user as a plain object
    const plainUser = user.get({ plain: true });
    // Set the prototype to the User constructor (to perform permission checks)
    Object.setPrototypeOf(plainUser, { constructor: { name: 'User' } });

    return {
      token,
      user: plainUser,
      device,
      facility,
    };
  }

  static async loginFromAuthorizationHeader(
    header: string | undefined | null,
    context: LoginContext,
  ): Promise<LoginReturn> {
    if (!header) {
      throw new MissingCredentialError('Missing authorization header');
    }

    const prefix = 'Bearer ';
    if (!header.startsWith(prefix)) {
      throw new InvalidCredentialError('Only Bearer token is supported');
    }

    const token = header.slice(prefix.length);
    if (token.length === 0) {
      throw new MissingCredentialError('Missing authorization token');
    }

    return await this.loginFromToken(token, context);
  }
}

export interface LoginContext {
  log: Logger;
  settings: ReadSettings;
  tokenDuration: number;
  tokenIssuer: string;
  tokenSecret: string;
}

export interface LoginReturn {
  token: string;
  user: User;
  device?: Device;
  facility?: Facility;
  internalClient?: boolean;
  settings?: {
    [key: string]: string | number | object;
  };
}
