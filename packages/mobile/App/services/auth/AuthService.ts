import mitt from 'mitt';

import { MODELS_MAP } from '~/models/modelsMap';
import { IUser, SyncConnectionParameters } from '~/types';
import { compare, hash } from './bcrypt';
import { CentralServerConnection } from '~/services/sync';
import { readConfig, writeConfig } from '~/services/config';
import {
  AuthenticationError,
  forbiddenFacilityMessage,
  invalidUserCredentialsMessage,
  OutdatedVersionError,
} from '../error';
import { ResetPasswordFormModel } from '/interfaces/forms/ResetPasswordFormProps';
import { ChangePasswordFormModel } from '/interfaces/forms/ChangePasswordFormProps';

import { VisibilityStatus } from '../../visibilityStatuses';
import { User } from '~/models/User';
import { PureAbility } from '@casl/ability';

export class AuthService {
  models: typeof MODELS_MAP;

  centralServer: CentralServerConnection;

  emitter = mitt();

  constructor(models: typeof MODELS_MAP, centralServer: CentralServerConnection) {
    this.models = models;
    this.centralServer = centralServer;

    this.centralServer.emitter.on('error', err => {
      if (err instanceof AuthenticationError || err instanceof OutdatedVersionError) {
        this.emitter.emit('authError', err);
      }
    });
  }

  async initialise(): Promise<void> {
    const server = await readConfig('syncServerLocation');
    await this.centralServer.connect(server);
  }

  async saveLocalUser(userData: Partial<IUser>, password: string): Promise<IUser> {
    // save password to repo for later use
    let user = await this.models.User.findOne({ where: { email: userData.email } });
    if (!user) {
      const newUser = await this.models.User.create(userData).save();
      if (!user) user = newUser;
    }

    // kick off a password hash & save
    // the hash takes a while on mobile, but we don't need to do anything with the result
    // of this until next login, so just start the process without awaiting it
    // the password could be synced from the server, but we just want to ensure in case sync fails,
    // we still have a password to use
    (async (): Promise<void> => {
      user.password = await hash(password);
      await user.save();
      console.log(`Set local password for ${user.email}`);
    })();

    // return the user that was saved to the database
    return user;
  }

  async localSignIn(
    { email, password }: SyncConnectionParameters,
    generateAbilityForUser: (user: User) => PureAbility,
  ): Promise<IUser> {
    const deviceFacilityId = await readConfig('facilityId', null);
    if (!deviceFacilityId) {
      throw new Error(
        'You need to first link this device to a facility before you can login offline.',
      );
    }

    console.log('Signing in locally as', email);
    const { User } = this.models;
    const user = await User.findOne({
      where: {
        email,
        visibilityStatus: VisibilityStatus.Current,
      },
    });

    if (!user.password) {
      throw new AuthenticationError(
        'You need to first login when connected to internet to use your account offline.',
      );
    }

    if (!user || !(await compare(password, user.password))) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    const ability = generateAbilityForUser(user);
    const canAccessFacility = await user.canAccessFacility(deviceFacilityId, ability, this.models);
    if (!canAccessFacility) {
      throw new AuthenticationError(forbiddenFacilityMessage);
    }

    return user;
  }

  async remoteSignIn(params: SyncConnectionParameters): Promise<{
    user: IUser;
    token: string;
    refreshToken: string;
    localisation: object;
    settings: object;
  }> {
    // always use the server stored in config if there is one - last thing
    // we want is a device syncing down data from one server and then up
    // to another!
    const syncServerLocation = await readConfig('syncServerLocation');
    const server = syncServerLocation || params.server;

    // create the sync source and log in to it
    await this.centralServer.connect(server);
    console.log(`Getting token from ${server}`);
    const { user, token, refreshToken, settings, localisation, permissions } =
      await this.centralServer.login(params.email, params.password);
    console.log(`Signed in as ${user.displayName}`);

    if (!syncServerLocation) {
      // after a successful login, if we didn't already read the server from
      // stored config, write the one we did use to config
      writeConfig('syncServerLocation', params.server);
    }

    // kick off a local save
    const userData = await this.saveLocalUser(user, params.password);

    const result = { user: userData, token, refreshToken, settings, localisation, permissions };
    this.emitter.emit('remoteSignIn', result);
    return result;
  }

  startSession(token: string, refreshToken: string): void {
    this.centralServer.setToken(token);
    this.centralServer.setRefreshToken(refreshToken);
  }

  endSession(): void {
    this.centralServer.clearToken();
    this.centralServer.clearRefreshToken();
  }

  async requestResetPassword(params: ResetPasswordFormModel): Promise<void> {
    const { server, email } = params;
    await this.centralServer.connect(server);
    await this.centralServer.post('resetPassword', {}, {
      email,
      deviceId: this.centralServer.deviceId,
    });
  }

  async changePassword(params: ChangePasswordFormModel): Promise<void> {
    const { server, ...rest } = params;
    await this.centralServer.connect(server);
    await this.centralServer.post('changePassword', {}, { ...rest });
  }
}
