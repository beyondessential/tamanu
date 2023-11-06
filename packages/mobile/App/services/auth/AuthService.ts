import mitt from 'mitt';

import { MODELS_MAP } from '~/models/modelsMap';
import { IUser, SyncConnectionParameters } from '~/types';
import { compare, hash } from './bcrypt';
import { CentralServerConnection } from '~/services/sync';
import { readConfig, writeConfig } from '~/services/config';
import { AuthenticationError, invalidUserCredentialsMessage, OutdatedVersionError } from '../error';
import { ResetPasswordFormModel } from '/interfaces/forms/ResetPasswordFormProps';
import { ChangePasswordFormModel } from '/interfaces/forms/ChangePasswordFormProps';

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
    this.centralServer.connect(server);
  }

  async saveLocalUser(userData: Partial<IUser>, password: string): Promise<IUser> {
    // save local password to repo for later use
    let user = await this.models.User.findOne({ email: userData.email });
    if (!user) {
      user = await this.models.User.create(userData).save();
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

  async localSignIn({ email, password }: SyncConnectionParameters): Promise<IUser> {
    console.log('Signing in locally as', email);
    const user = await this.models.User.findOne({
      email,
    });

    if (!user || !(await compare(password, user.localPassword))) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    return user;
  }

  async remoteSignIn(
    params: SyncConnectionParameters,
  ): Promise<{
    user: IUser;
    token: string;
    refreshToken: string;
    localisation: object;
  }> {
    // always use the server stored in config if there is one - last thing
    // we want is a device syncing down data from one server and then up
    // to another!
    const syncServerLocation = await readConfig('syncServerLocation');
    const server = syncServerLocation || params.server;

    // create the sync source and log in to it
    this.centralServer.connect(server);
    console.log(`Getting token from ${server}`);
    const { user, token, refreshToken, localisation, permissions } = await this.centralServer.login(
      params.email,
      params.password,
    );
    console.log(`Signed in as ${user.displayName}`);

    if (!syncServerLocation) {
      // after a successful login, if we didn't already read the server from
      // stored config, write the one we did use to config
      writeConfig('syncServerLocation', params.server);
    }

    // kick off a local save
    const userData = await this.saveLocalUser(user, params.password);

    const result = { user: userData, token, refreshToken, localisation, permissions };
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
    this.centralServer.connect(server);
    await this.centralServer.post('resetPassword', {}, { email });
  }

  async changePassword(params: ChangePasswordFormModel): Promise<void> {
    const { server, ...rest } = params;
    this.centralServer.connect(server);
    await this.centralServer.post('changePassword', {}, { ...rest });
  }
}
