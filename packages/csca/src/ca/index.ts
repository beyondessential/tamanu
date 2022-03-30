import { promises as fs } from 'fs';
import { join } from 'path';

import prompts from 'prompts';

import Config, { ConfigFile, period } from './Config';
import { CRL_URL_BASE, CSCA_PKUP, CSCA_VALIDITY } from './constants';
import crypto from '../crypto';
import { Profile, signerWorkingTime, signerDefaultValidity, signerExtensions } from './Profile';
import State from './State';
import Log from './Log';
import { writePrivateKey, writePublicKey } from './Keys';

const MASTER_KEY_DERIVATION_ROUNDS = 10_000;
const MASTER_KEY_DERIVATION_SALT = Buffer.from('80cbc05e08253326ca714c66b2a290186072d4a4c996e90d21bde6fcc4c412cb', 'hex');

export default class CA {
  private path: string;
  private masterKey: CryptoKey | undefined;

  constructor(path: string) {
    this.path = path;
  }

  private async askPassphrase(confirm: boolean = false) {
    if (!this.masterKey) {
      const { value }: { value: string } = await prompts({
        type: 'password',
        name: 'value',
        message: `Enter CSCA passphrase${confirm ? ' (min 30 characters)' : ''}`,
        validate: (value: string) => (value.length < 30)
          ? 'Passphrase must be at least 30 characters long'
          : true,
      });

      if (confirm) {
        const { confirm }: { confirm: string } = await prompts({
          type: 'password',
          name: 'confirm',
          message: 'Confirm CSCA passphrase',
        });

        if (value !== confirm) {
          throw new Error('Passphrase mismatch');
        }
      }

      if (!value) throw new Error('Passphrase is required');

      const enc = new TextEncoder();
      const passphrase = await crypto.subtle.importKey(
        'raw',
        enc.encode(value),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
      );

      this.masterKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: MASTER_KEY_DERIVATION_SALT,
          iterations: MASTER_KEY_DERIVATION_ROUNDS,
          hash: 'SHA-256',
        },
        passphrase,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey'],
      );
    }
  }

  private async confirm(message: string) {
    const { value } = await prompts({
      type: 'confirm',
      name: 'value',
      message,
    });

    if (!value) {
      throw new Error('Aborted');
    }
  }

  private join(...paths: string[]) {
    return join(this.path, ...paths);
  }

  public async create(
    shortname: string,
    fullname: string,
    countryAlpha2: string,
    countryAlpha3: string,
    profile: Profile,
    provider: undefined | string,
    deptOrg: undefined | string,
  ) {
    if (await fs.stat(this.path).then(() => true, () => false)) {
      throw new Error(`${this.path} already exists, not overwriting`);
    }

    const now = new Date();

    const config: ConfigFile = {
      name: shortname,
      country: {
        alpha2: countryAlpha2,
        alpha3: countryAlpha3,
      },
      subject: {
        country: countryAlpha2,
        commonName: fullname,
        organisation: provider,
        organisationUnit: deptOrg,
      },
      crl: {
        filename: `${shortname}.crl`,
        distribution: [`${CRL_URL_BASE}/${shortname}.crl`],
      },
      workingPeriod: period(now, CSCA_PKUP),
      validityPeriod: period(now, CSCA_VALIDITY),
      issuance: {
        workingPeriodDays: signerWorkingTime(profile).days!,
        validityPeriodDays: signerDefaultValidity(profile).days!,
        extensions: signerExtensions(profile),
      },
    };

    console.info('CSCA Config:', JSON.stringify(config, null, 2));
    await this.confirm('Proceed?');
    await this.askPassphrase(true);

    for (const dir of ['.', 'certs']) {
      const path = this.join(dir);
      console.debug('mkdir', path);
      await fs.mkdir(path, { recursive: true });
    }

    console.debug('generate keypair');
    const { publicKey, privateKey } = await crypto.subtle.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-256',
    }, true, ['sign', 'verify']);

    console.debug('init config.json');
    const configFile = new Config(this.path, privateKey, true);
    await configFile.create(config);

    console.debug('init state.json');
    const stateFile = new State(this.path, privateKey, true);
    await stateFile.create();

    console.debug('init ndjson.json');
    const logFile = new Log(this.path, privateKey, true);
    await logFile.create();

    console.debug('write private key');
    await writePrivateKey(this.join('ca.key'), privateKey, this.masterKey!);

    console.debug('write public key');
    await writePublicKey(this.join('ca.pub'), publicKey);

    // TODO: crt, crl
  }
}
