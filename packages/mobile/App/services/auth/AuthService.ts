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
  }

   async initialise(): Promise<void> {
    const server = await readConfig('syncServerLocation');
    if (!server) return;
    const url = new URL(server);
    url.pathname = '/api';
    this.centralServer.setEndpoint(url.toString());
    await this.centralServer.connect();
    this.centralServer.emitter.on('error', err => {
      if (err instanceof AuthenticationError || err instanceof OutdatedVersionError) {
        this.emitter.emit('authError', err);
      }
    });
  }

  async saveLocalUser(userData: Partial<IUser>, password: string): Promise<IUser> {
    // save local password to repo for later use
    let user = await this.models.User.findOne({ where: { email: userData.email } });
    if (!user) {
      const newUser = await this.models.User.create(userData).save();
      if (!user) user = newUser;
    }

    // kick off a local password hash & save
    // the hash takes a while on mobile, but we don't need to do anything with the result
    // of this until next login, so just start the process without awaiting it
    (async (): Promise<void> => {
      user.localPassword = await hash(password);
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
    console.log('Signing in locally as', email);
    const { User, Setting } = this.models;
    const user = await User.findOne({
      where: {
        email,
        visibilityStatus: VisibilityStatus.Current,
      },
    });

    if (!user.localPassword) {
      throw new AuthenticationError(
        'You need to first login when connected to internet to use your account offline.',
      );
    }

    if (!user || !(await compare(password, user.localPassword))) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    const ability = generateAbilityForUser(user);
    const restrictUsersToFacilities = await Setting.getByKey('auth.restrictUsersToFacilities');
    const canLogIntoAllFacilities = ability.can('login', 'Facility');
    const linkedFacility = await readConfig('facilityId', '');
    if (
      restrictUsersToFacilities &&
      !canLogIntoAllFacilities &&
      !(await user.canAccessFacility(linkedFacility))
    ) {
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

    console.log(`Getting token from ${server}`);
    const { user, token, refreshToken, settings, localisation, permissions } =
      await this.centralServer.connect(params);
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
    this.centralServer.setToken(token, refreshToken);
  }
  
  endSession(): void {
    this.centralServer.clearToken();
  }

  async requestResetPassword(params: ResetPasswordFormModel): Promise<void> {
    const { email, server } = params;
    await this.initialiseCentralServerConnection(server);
    await this.centralServer.post('resetPassword', { email });
  }

  async changePassword(params: ChangePasswordFormModel): Promise<void> {
    const { server, ...rest } = params;
    await this.initialiseCentralServerConnection(server);
    await this.centralServer.post('changePassword', { ...rest });
  }
}
