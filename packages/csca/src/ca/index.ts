import { promises as fs } from 'fs';
import { join } from 'path';

import prompts from 'prompts';
import { Pkcs10CertificateRequest } from '@peculiar/x509';

import Config, { ConfigFile, period } from './Config';
import { confirm, keyPairFromPrivate } from '../utils';
import { CRL_URL_BASE, CSCA_PKUP, CSCA_VALIDITY, EKU_HEALTH_CSCA } from './constants';
import crypto from '../crypto';
import { Profile, signerWorkingTime, signerDefaultValidity, signerExtensions } from './profile';
import State from './State';
import Log from './Log';
import { deriveSymmetricKey, makeKeyPair, readPrivateKey, readPublicKey, writePrivateKey, writePublicKey } from './keys';
import Certificate from './Certificate';
import { ComputedExtension, ExtensionName } from './certificateExtensions';

const MASTER_KEY_DERIVATION_ROUNDS = 10_000;
const MASTER_KEY_DERIVATION_SALT = Buffer.from(
  '80cbc05e08253326ca714c66b2a290186072d4a4c996e90d21bde6fcc4c412cb',
  'hex',
);

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
        validate: (value: string) =>
          value.length < 30 ? 'Passphrase must be at least 30 characters long' : true,
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

      this.masterKey = await deriveSymmetricKey(
        value,
        MASTER_KEY_DERIVATION_SALT,
        MASTER_KEY_DERIVATION_ROUNDS,
      );
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
    if (await fsExists(this.path)) {
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
    await confirm('Proceed?');
    await this.askPassphrase(true);

    for (const dir of ['.', 'certs']) {
      const path = this.join(dir);
      console.debug('mkdir', path);
      await fs.mkdir(path, { recursive: true });
    }

    console.debug('generate keypair');
    const keyPair = await makeKeyPair();

    console.debug('init config.json');
    await this.config(keyPair.privateKey, true).create(config);

    console.debug('init state.json');
    await this.state(keyPair.privateKey, true).create();

    console.debug('init log.ndjson');
    await this.log(keyPair.privateKey, true).create();

    console.debug('write private key');
    await writePrivateKey(this.join('ca.key'), keyPair.privateKey, this.masterKey!);

    console.debug('write public key');
    await writePublicKey(this.join('ca.pub'), keyPair.publicKey);

    const root = await Certificate.createRoot(
      {
        subject: config.subject,
        serial: Buffer.from(crypto.getRandomValues(new Uint8Array(16))),
        validityPeriod: config.validityPeriod,
        workingPeriod: config.workingPeriod,
        extensions: [
          {
            name: ExtensionName.BasicConstraints,
            critical: true,
            value: [true, 0],
          },
          {
            name: ExtensionName.SubjectAltName,
            critical: false,
            value: [{ L: config.country.alpha3 }],
          },
          {
            name: ExtensionName.IssuerAltName,
            critical: false,
            value: [{ L: config.country.alpha3 }],
          },
          {
            name: ExtensionName.SubjectKeyIdentifier,
            critical: false,
            value: ComputedExtension,
          },
          {
            name: ExtensionName.AuthorityKeyIdentifier,
            critical: true,
            value: ComputedExtension,
          },
          {
            name: ExtensionName.KeyUsage,
            critical: true,
            value: ['cRLSign', 'keyCertSign'],
          },
          {
            name: ExtensionName.ExtendedKeyUsage,
            critical: false,
            value: [EKU_HEALTH_CSCA],
          },
          {
            name: ExtensionName.CrlDistributionPoints,
            critical: false,
            value: config.crl.distribution,
          },
          {
            name: ExtensionName.PrivateKeyUsagePeriod,
            critical: false,
            value: ComputedExtension,
          },
        ],
      },
      keyPair,
    );

    console.debug('write root certificate');
    await root.write(this.join('ca.crt'));

    // TODO: crl
  }

  private config(key: CryptoKey, newfile?: boolean): Config {
    return new Config(this.path, key, newfile);
  }

  private state(key: CryptoKey, newfile?: boolean): State {
    return new State(this.path, key, newfile);
  }

  private log(key: CryptoKey, newfile?: boolean): Log {
    return new Log(this.path, key, newfile);
  }

  private async root(): Promise<Certificate> {
    return Certificate.read(this.join('ca.crt'));
  }

  private async checkIntegrity(key: CryptoKey) {
    if (key.type === 'private') {
      const { publicKey } = await keyPairFromPrivate(key);
      const pkE = await crypto.subtle.exportKey('jwk', publicKey);

      const publicKeyFromFile = await readPublicKey(this.join('ca.pub'));
      const pkF = await crypto.subtle.exportKey('jwk', publicKeyFromFile);

      if (pkE.kty !== pkF.kty || pkE.crv !== pkF.crv || pkE.x !== pkF.x || pkE.y !== pkF.y) {
        throw new Error('Public key on disk doesn\'t match private key');
      }
    }

    await this.config(key).check();
    await this.state(key).check();
    await this.log(key).check();

    await this.root().then(cert => cert.check(key));

    // TODO: check signature on CRL

    // console.debug('check integrity: OK');
  }

  private async publicKey(): Promise<CryptoKey> {
    const publicKey = await readPublicKey(this.join('ca.pub'));
    this.checkIntegrity(publicKey);
    return publicKey;
  }

  private async privateKey(): Promise<CryptoKey> {
    await this.publicKey();
    await this.askPassphrase();

    const privateKey = await readPrivateKey(this.join('ca.key'), this.masterKey!);
    await this.checkIntegrity(privateKey);

    return privateKey;
  }

  public async issueFromRequest(request: Pkcs10CertificateRequest): Promise<Certificate> {
    const privateKey = await this.privateKey();
    const issuer = await this.root();

    const config = this.config(privateKey);
    const issuanceConfig = await config.getIssuance();
    const countryConfig = await config.getCountry();

    const state = this.state(privateKey);
    const serial = await state.nextIssuanceSerial();

    const now = new Date();

    console.debug('issue certificate');
    const cert = await Certificate.createFromRequest({
      subject: {
        country: countryConfig.alpha2,
        commonName: 'TA',
      },
      serial,
      validityPeriod: period(now, { days: issuanceConfig.validityPeriodDays }),
      workingPeriod: period(now, { days: issuanceConfig.workingPeriodDays }),
      extensions: issuanceConfig.extensions,
    }, request, issuer, privateKey);

    console.debug(`mkdir certs/${cert.certId}`);
    await fs.mkdir(this.join('certs', cert.certId), { recursive: true });

    console.debug('write certificate');
    await cert.write(this.join('certs', cert.certId, 'certificate.crt'));

    console.debug('write request');
    await fs.writeFile(this.join('certs', cert.certId, 'request.csr'), request.toString('pem'));

    return cert;
  }
}

async function fsExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch (_) {
    return false;
  }
}
